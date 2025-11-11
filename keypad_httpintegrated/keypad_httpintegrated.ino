#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "VOO-047519";
const char* password = "LDMCFNHY";

const char* servDjango = "http://192.168.0.8:8000/auth/keypad/";

const int idLock = 2;

// Keypad layout
const char KEYS[4][4] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};

// GPIO pins
const int ROW_PINS[4] = {13, 12, 14, 27};
const int COL_PINS[4] = {26, 25, 33, 32};
const int LED_PIN = 15;
const int REED_PIN = 4; // capteur reed

bool codeValide = false;
bool porteOuverte = false;
int lastReedState = HIGH; // pour détecter les changements d’état

// Scanner le keypad
char scanKeypad() {
  for (int i = 0; i < 4; i++) {
    for (int r = 0; r < 4; r++) digitalWrite(ROW_PINS[r], LOW);
    digitalWrite(ROW_PINS[i], HIGH);
    for (int j = 0; j < 4; j++) {
      if (digitalRead(COL_PINS[j]) == HIGH) return KEYS[i][j];
    }
    digitalWrite(ROW_PINS[i], LOW);
  }
  return '\0';
}

// Lire le code entré
String getCode() {
  String inputStr = "";
  while (true) {
    char key = scanKeypad();
    if (key != '\0') {
      Serial.print("Pressed: ");
      Serial.println(key);
      delay(200); // debounce
      if (key == '*') {
        inputStr = "";
        Serial.println("Cleared");
      } else if (key == '#') {
        return inputStr;
      } else {
        inputStr += key;
      }
    }
    delay(50);
  }
}

// LED clignotante pour mauvais code
void wrongCode() {
  Serial.println("Wrong code!");
  unsigned long end_time = millis() + 2000;
  while (millis() < end_time) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    delay(200);
  }
  digitalWrite(LED_PIN, LOW);
}

void setup() {
  Serial.begin(115200);

  // Connexio au wifi
  WiFi.begin(ssid, password);
  Serial.print("Connexion Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnecté !");

  Serial.println("=== Système de contrôle de porte prêt ===");

  // Initialisation du keypad
  for (int i = 0; i < 4; i++) {
    pinMode(ROW_PINS[i], OUTPUT);
    digitalWrite(ROW_PINS[i], LOW);
    pinMode(COL_PINS[i], INPUT_PULLDOWN);
  }

  // LED externe
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Reed switch
  pinMode(REED_PIN, INPUT_PULLUP); // fermé = LOW, ouvert = HIGH
}

void loop() {
  int reedState = digitalRead(REED_PIN);

  // 🔸 Log de l’état du reed (uniquement s’il change)
  if (reedState != lastReedState) {
    if (reedState == LOW) {
      Serial.println("[Reed] Porte fermée (aimant détecté)");
    } else {
      Serial.println("[Reed] Porte ouverte (aimant éloigné)");
    }
    lastReedState = reedState;
  }

  // 1️⃣ Attente du code
  if (!codeValide) {
    Serial.println("➡️  Entrez le code, puis appuyez sur #");
    String code = getCode();
    Serial.print("Vous avez entré : ");
    Serial.println(code);

    // http POST
     HTTPClient httpPost;
    httpPost.begin(servDjango);  // endpoint qui renvoie ce qu’on envoie
    httpPost.addHeader("Content-Type", "application/json");
    String json = "{\"code\": " + String(code) + ", \"lock\": " + String(idLock) + "}";
    Serial.println("\n📤 Envoi POST :");
    Serial.println(json);
    int postCode = httpPost.POST(json);
    if (postCode > 0) {
      Serial.printf("Code HTTP : %d\n", postCode);
      Serial.println("Réponse du serveur :");
      Serial.println(httpPost.getString());
      if (postCode == 200) {
        Serial.println("✅ Code correct !");
        codeValide = true;
      } else {
        wrongCode();
      }
    } else {
      Serial.printf("Erreur POST : %s\n", httpPost.errorToString(postCode).c_str());
    }

    httpPost.end();
  }

  // 2️⃣ Gestion LED selon état du reed
  if (codeValide) {
    if (reedState == LOW) {
      // porte fermée → LED allumée
      digitalWrite(LED_PIN, HIGH);
    } else {
      // porte ouverte → LED clignote
      digitalWrite(LED_PIN, !digitalRead(LED_PIN));
      delay(200);
    }

    // 3️⃣ Réinitialisation quand porte refermée après ouverture
    if (reedState == HIGH) {
      porteOuverte = true; // on détecte ouverture
    }
    if (porteOuverte && reedState == LOW) {
      Serial.println("🔁 Porte refermée → réinitialisation du système");
      digitalWrite(LED_PIN, LOW);
      codeValide = false;
      porteOuverte = false;
      delay(1000);
    }
  }
}
