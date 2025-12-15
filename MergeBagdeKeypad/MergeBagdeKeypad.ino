#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <INA3221.h>   // <-- ajout

Config Wifi
const char* ssid     = "";          // 
const char* password = ""; // 

const char* BADGE_URL  = "http://10.171.34.72:8000/auth/badge/";   // endpoint RFID
const char* KEYPAD_URL = "http://10.171.34.72:8000/auth/keypad/";  // endpoint clavier
const int   lockId     = 1;                                       // même ID pour les 2

// Setup pont H
const int MPLUS_PIN  = 15; // M+
const int MMINUS_PIN = 2;  // M-

// LED interne
const int LED_WIFI = 2;

// I2C INA3221
const int INA_SDA = 16;
const int INA_SCL = 17;

// RC522
#define RST_PIN 22
#define SS_PIN  5
MFRC522 mfrc522(SS_PIN, RST_PIN);

// Keypad
const char KEYS[4][4] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};
const int ROW_PINS[4] = {13, 12, 14, 27};
const int COL_PINS[4] = {26, 25, 33, 32};

// ================= ÉTAT SYSTÈME =================
bool  codeValid        = false;
bool  doorOpened       = false;
bool  sequenceFinished = false;
int   lastReedState    = HIGH;
unsigned long authTimestamp = 0;  // pour timeout sécurité

// ================= INA3221 =================
INA3221 ina3221(INA3221_ADDR40_GND);  // adresse 0x40 par défaut [web:30][web:48]
unsigned long lastInaRead = 0;

// ================= MOTEUR =================
void motorStop() {
  digitalWrite(MPLUS_PIN, LOW);
  digitalWrite(MMINUS_PIN, LOW);
}

void pulseMotorPlus() {
  Serial.println("MOTEUR: pulse M+ (engage poignée)");
  digitalWrite(MPLUS_PIN, HIGH);
  digitalWrite(MMINUS_PIN, HIGH);
  delay(1000);
  motorStop();
}

void pulseMotorMinus() {
  Serial.println("MOTEUR: pulse M- (désengage poignée)");
  digitalWrite(MPLUS_PIN, LOW);
  digitalWrite(MMINUS_PIN, HIGH);
  delay(1000);
  motorStop();
}

// ================= RFID =================
String readCardContent() {
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return "";
  }
  if (!mfrc522.PICC_ReadCardSerial()) {
    Serial.println("RFID: UID non lu");
    return "";
  }

  byte block = 4;
  byte buffer[18];
  byte size = sizeof(buffer);

  MFRC522::MIFARE_Key key;
  byte keyData[6] = {0xD3, 0xF7, 0xD3, 0xF7, 0xD3, 0xF7};
  for (byte i = 0; i < 6; i++) {
    key.keyByte[i] = keyData[i];
  }

  MFRC522::StatusCode status;
  status = (MFRC522::StatusCode)mfrc522.PCD_Authenticate(
              MFRC522::PICC_CMD_MF_AUTH_KEY_A,
              block,
              &key,
              &(mfrc522.uid)
           );
  if (status != MFRC522::STATUS_OK) {
    Serial.print("RFID Auth error: ");
    Serial.println(mfrc522.GetStatusCodeName(status));
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    return "";
  }

  status = (MFRC522::StatusCode)mfrc522.MIFARE_Read(block, buffer, &size);
  if (status != MFRC522::STATUS_OK) {
    Serial.print("RFID Read error: ");
    Serial.println(mfrc522.GetStatusCodeName(status));
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    return "";
  }

  int tIndex = -1;
  for (byte i = 0; i < 16; i++) {
    if (buffer[i] == 0x54) { // 'T'
      tIndex = i;
      break;
    }
  }

  String content = "";
  if (tIndex >= 0 && tIndex + 2 < 16) {
    byte langLen   = buffer[tIndex + 1];
    byte textStart = tIndex + 2 + langLen;
    for (byte i = textStart; i < 16; i++) {
      byte b = buffer[i];
      if (b >= 32 && b <= 126) {
        content += (char)b;
      }
    }
  }

  Serial.print("RFID: NDEF = ");
  Serial.println(content);

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  return content;
}

// ================= CLAVIER =================
char scanKeypad() {
  for (int i = 0; i < 4; i++) {
    // mettre toutes les lignes à LOW
    for (int r = 0; r < 4; r++) digitalWrite(ROW_PINS[r], LOW);
    // activer la ligne i
    digitalWrite(ROW_PINS[i], HIGH);

    for (int j = 0; j < 4; j++) {
      if (digitalRead(COL_PINS[j]) == HIGH) {
        digitalWrite(ROW_PINS[i], LOW);
        return KEYS[i][j];
      }
    }

    digitalWrite(ROW_PINS[i], LOW);
  }
  return '\0';
}

String readKeypadCode() {
  static String buffer = "";
  char key = scanKeypad();

  if (key != '\0') {
    Serial.print("KEYPAD: ");
    Serial.println(key);
    delay(200); // debounce

    if (key == '*') {
      buffer = "";
      Serial.println("KEYPAD: reset saisie");
    } else if (key == '#') {
      String finalCode = buffer;
      buffer = "";
      Serial.print("KEYPAD: code complet = ");
      Serial.println(finalCode);
      return finalCode;
    } else {
      buffer += key;
    }
  }
  return "";
}

// ================= HTTP =================
bool sendAuthRequest(const String& url, const String& code) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("HTTP: WiFi non connecté");
    return false;
  }

  HTTPClient httpPost;
  httpPost.begin(url);
  httpPost.addHeader("Content-Type", "application/json");

  String json = "{\"code\": \"" + code + "\", \"lock\": " + String(lockId) + "}";
  Serial.println("\nHTTP -> " + url);
  Serial.println("Payload: " + json);

  int postCode = httpPost.POST(json);
  Serial.print("HTTP status: ");
  Serial.println(postCode);

  if (postCode > 0) {
    String resp = httpPost.getString();
    Serial.println("Réponse serveur:");
    Serial.println(resp);
  }

  bool ok = (postCode == 200);
  httpPost.end();
  return ok;
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  pinMode(LED_WIFI, OUTPUT);  // LED interne pour le clignotement WiFi

  // I2C INA3221 sur GPIO 16/17
  Wire.begin(INA_SDA, INA_SCL);         // SDA, SCL [web:27]
  ina3221.begin(&Wire);
  ina3221.reset();
  ina3221.setShuntRes(100, 100, 100);   // mΩ, à adapter à ton shunt [web:30][web:48]
  Serial.println("INA3221 initialisé");

  WiFi.begin(ssid, password);
  Serial.print("Connexion WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_WIFI, !digitalRead(LED_WIFI));  // clignote pendant la connexion
    delay(500);
    Serial.print(".");
  }
  digitalWrite(LED_WIFI, LOW); // éteint une fois connecté
  Serial.println("\nWiFi connecté");

  // Moteur
  pinMode(MPLUS_PIN,  OUTPUT);
  pinMode(MMINUS_PIN, OUTPUT);
  motorStop();

  // RFID
  SPI.begin();
  pinMode(SS_PIN, OUTPUT);
  mfrc522.PCD_Init();
  Serial.println("RC522 initialisé");

  // Keypad
  for (int i = 0; i < 4; i++) {
    pinMode(ROW_PINS[i], OUTPUT);
    digitalWrite(ROW_PINS[i], LOW);
    pinMode(COL_PINS[i], INPUT_PULLDOWN);
  }

  Serial.println("Système prêt: RFID + CLAVIER");
}

// ================= LOOP =================
void loop() {
  // Lecture INA3221 toutes les 2 secondes sur le channel 1
  if (millis() - lastInaRead >= 2000) {
    lastInaRead = millis();

    // Avec la lib TinyuZhao: CH1 = INA3221_CH1, getVoltage() en V, getCurrent() en A [web:30][web:48]
    float busV    = ina3221.getVoltage(INA3221_CH1);
    float current = ina3221.getCurrent(INA3221_CH1) * 1000.0;  // mA

    Serial.print("INA3221 CH1 - Bus: ");
    Serial.print(busV);
    Serial.print(" V, I: ");
    Serial.print(current);
    Serial.println(" mA");
  }

  // 1) Tant que séquence pas finie et pas encore de code valide -> accepter badge OU clavier
  if (!codeValid && !sequenceFinished) {
    // Essai RFID
    String badgeCode = readCardContent();
    if (badgeCode.length() > 0) {
      Serial.println("Auth via BADGE");
      if (sendAuthRequest(BADGE_URL, badgeCode)) {
        Serial.println("Accès BADGE OK");
        codeValid       = true;
        authTimestamp   = millis();
        doorOpened      = false;
        pulseMotorPlus();      // ouverture immédiate
      } else {
        Serial.println("Accès BADGE REFUSÉ");
      }
    }

    // Essai clavier (en parallèle: on lit les touches à chaque loop)
    String keypadCode = readKeypadCode();
    if (keypadCode.length() > 0 && !codeValid) { // si badge n'a pas déjà validé
      Serial.println("Auth via CLAVIER");
      if (sendAuthRequest(KEYPAD_URL, keypadCode)) {
        Serial.println("Accès CLAVIER OK");
        codeValid       = true;
        authTimestamp   = millis();
        doorOpened      = false;
        pulseMotorPlus();     // ouverture immédiate
      } else {
        Serial.println("Accès CLAVIER REFUSÉ");
      }
    }
  }

  // 2) Gestion de la séquence après un accès valide
  if (codeValid && !sequenceFinished) {
    // plus de reed: on se base uniquement sur le temps
    // attendre 5 s puis M-
    static unsigned long openDetectedTime = 0;
    if (openDetectedTime == 0) {
      openDetectedTime = millis();
      Serial.println("Temporisation 5s avant fermeture (M-)");
    }
    if (millis() - openDetectedTime > 5000) {
      pulseMotorMinus();
      sequenceFinished  = true;
      codeValid         = false;
      openDetectedTime  = 0;
      Serial.println("Séquence terminée");
    }
  }

  // Sécurité précédente basée sur le reed supprimée.
}
