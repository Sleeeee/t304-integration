#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

const char* ssid = "";
const char* password = "";
const char* servDjango = "http://172.0.0.1:8000/auth/badge/";
const int idLock = 1;

// pinning RC522
#define RST_PIN 22
#define SS_PIN  5
MFRC522 mfrc522(SS_PIN, RST_PIN);

// GPIO pins
const int RELAY_PIN = 15;
const int REED_PIN  = 4;

bool codeValide           = false;
bool porteOuverte         = false;
int  lastReedState        = HIGH;
bool demandeCarteAffichee = false;

// Lit le contenu du bloc 4 et renvoie SEULEMENT le texte NDEF (ex: "caca")
String readCardContent() {
  // Attendre une nouvelle carte
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return "";
  }
  if (!mfrc522.PICC_ReadCardSerial()) {
    return "";
  }

  byte block = 4;
  byte buffer[18];
  byte size = sizeof(buffer);

  // Clé A 
  MFRC522::MIFARE_Key key;
  byte keyData[6] = {0xD3, 0xF7, 0xD3, 0xF7, 0xD3, 0xF7};
  for (byte i = 0; i < 6; i++) {
    key.keyByte[i] = keyData[i];
  }

  // Authentification
  MFRC522::StatusCode status;
  status = (MFRC522::StatusCode)mfrc522.PCD_Authenticate(
             MFRC522::PICC_CMD_MF_AUTH_KEY_A,
             block,
             &key,
             &(mfrc522.uid)
           );
  if (status != MFRC522::STATUS_OK) {
    Serial.print("Erreur d'authentification : ");
    Serial.println(mfrc522.GetStatusCodeName(status));
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    return "";
  }

  // Lecture du bloc
  status = (MFRC522::StatusCode)mfrc522.MIFARE_Read(block, buffer, &size);
  if (status != MFRC522::STATUS_OK) {
    Serial.print("Erreur de lecture : ");
    Serial.println(mfrc522.GetStatusCodeName(status));
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    return "";
  }

  // Décodage simplifié NDEF Text Record pour récupérer uniquement le texte
  int tIndex = -1;
  for (byte i = 0; i < 16; i++) {
    if (buffer[i] == 0x54) { // 'T'
      tIndex = i;
      break;
    }
  }

  String content = "";
  if (tIndex >= 0 && tIndex + 2 < 16) {
    byte langLen  = buffer[tIndex + 1];          // longueur du code langue
    byte textStart = tIndex + 2 + langLen;       // début réel du texte

    Serial.print("NDEF langue : ");
    for (byte i = 0; i < langLen && (tIndex + 2 + i) < 16; i++) {
      Serial.print((char)buffer[tIndex + 2 + i]);
    }
    Serial.println();

    Serial.print("NDEF texte   : ");
    for (byte i = textStart; i < 16; i++) {
      byte b = buffer[i];
      if (b >= 32 && b <= 126) {
        Serial.print((char)b);
        content += (char)b;
      } else {
        Serial.print('.');
      }
    }
    Serial.println();
  } else {
    Serial.println("Pas d'enregistrement texte NDEF détecté dans ce bloc (ou tronqué).");
  }

  Serial.print("Texte renvoyé par readCardContent() : ");
  Serial.println(content);

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  return content;
}

void setup() {
  Serial.begin(115200);

  // Connexion WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connexion Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnecté !");

  // Init RC522
  SPI.begin();
  pinMode(SS_PIN, OUTPUT);
  mfrc522.PCD_Init();
  Serial.println("Init RC522 OK. Présente une carte...");

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);

  pinMode(REED_PIN, INPUT_PULLUP);
}

void loop() {
  int reedState = digitalRead(REED_PIN);

  if (reedState != lastReedState) {
    if (reedState == LOW) {
      Serial.println("[Reed] Porte fermée (aimant détecté)");
    } else {
      Serial.println("[Reed] Porte ouverte (aimant éloigné)");
    }
    lastReedState = reedState;
  }

  if (!codeValide) {
    // Afficher le message une seule fois tant qu'on attend une carte
    if (!demandeCarteAffichee) {
      Serial.println("Présente une carte RFID (lecture NDEF texte bloc 4)");
      demandeCarteAffichee = true;
    }

    String cardContent = readCardContent();  // ici ça renverra "caca"
    if (cardContent != "") {
      Serial.print("Données envoyées comme 'code' : ");
      Serial.println(cardContent);

      HTTPClient httpPost;
      httpPost.begin(servDjango);
      httpPost.addHeader("Content-Type", "application/json");

      String json = "{\"code\": \"" + cardContent + "\", \"lock\": " + String(idLock) + "}";
      Serial.println("\nEnvoi POST :");
      Serial.println(json);

      int postCode = httpPost.POST(json);
      if (postCode > 0) {
        Serial.printf("Code HTTP : %d\n", postCode);
        Serial.println("Réponse du serveur :");
        Serial.println(httpPost.getString());
        if (postCode == 200) {
          Serial.println("Accès autorisé !");
          codeValide   = true;
          porteOuverte = false;
          digitalWrite(RELAY_PIN, HIGH);
        } else {
          Serial.println("Accès refusé !");
          digitalWrite(RELAY_PIN, LOW);
        }
      } else {
        Serial.printf("Erreur POST : %s\n", httpPost.errorToString(postCode).c_str());
      }
      httpPost.end();
    }
  }

  if (codeValide) {
    if (reedState == HIGH) {
      porteOuverte = true;
      digitalWrite(RELAY_PIN, HIGH);
    }
    if (porteOuverte && reedState == LOW) {
      Serial.println("🔁 Porte refermée → réinitialisation du système");
      digitalWrite(RELAY_PIN, LOW);
      codeValide           = false;
      porteOuverte         = false;
      demandeCarteAffichee = false;
      delay(1000);
    }
  }
}
