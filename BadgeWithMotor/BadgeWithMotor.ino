#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

const char* ssid = "";
const char* password = "";
const char* djangoServer = "http://127.0.0.1:8000/auth/badge/";
const int lockId = 1;

// RC522 pins
#define RST_PIN 22
#define SS_PIN  5
MFRC522 mfrc522(SS_PIN, RST_PIN);

// HB5 with two direction pins
const int MPLUS_PIN  = 15;   // drives motor in the "M+" direction (engage)
const int MMINUS_PIN = 2;    // drives motor in the "M-" direction (disengage)

// Reed switch
const int REED_PIN  = 4;

bool codeValid            = false;
bool doorOpened           = false;
int  lastReedState        = HIGH;
bool cardRequestDisplayed = false;
bool sequenceFinished     = false;  // after M- pulse, wait for a new badge

// Read block 4 and return NDEF text
String readCardContent() {
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return "";
  }
  if (!mfrc522.PICC_ReadCardSerial()) {
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
    Serial.print("Auth error: ");
    Serial.println(mfrc522.GetStatusCodeName(status));
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    return "";
  }

  status = (MFRC522::StatusCode)mfrc522.MIFARE_Read(block, buffer, &size);
  if (status != MFRC522::STATUS_OK) {
    Serial.print("Read error: ");
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

    Serial.print("NDEF language: ");
    for (byte i = 0; i < langLen && (tIndex + 2 + i) < 16; i++) {
      Serial.print((char)buffer[tIndex + 2 + i]);
    }
    Serial.println();

    Serial.print("NDEF text: ");
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
    Serial.println("No NDEF text record in this block (or truncated).");
  }

  Serial.print("Text returned by readCardContent(): ");
  Serial.println(content);

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  return content;
}

// Stop motor (both directions off)
void motorStop() {
  digitalWrite(MPLUS_PIN, LOW);
  digitalWrite(MMINUS_PIN, LOW);
}

// 1 second pulse in M+ direction (engage handle)
void pulseMotorPlus() {
  Serial.println("1 s pulse on M+ (engage handle)");
  digitalWrite(MPLUS_PIN, HIGH);
  digitalWrite(MMINUS_PIN, HIGH);
  delay(1000);
  motorStop();
}

// 1 second pulse in M- direction (disengage handle)
void pulseMotorMinus() {
  Serial.println("1 s pulse on M- (disengage handle)");
  digitalWrite(MPLUS_PIN, LOW);
  digitalWrite(MMINUS_PIN, HIGH);
  delay(1000);
  motorStop();
}

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  Serial.print("Wi-Fi connection");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected!");

  SPI.begin();
  pinMode(SS_PIN, OUTPUT);
  mfrc522.PCD_Init();
  Serial.println("RC522 initialized. Present a card...");

  // HB5 two-pin control
  pinMode(MPLUS_PIN, OUTPUT);
  pinMode(MMINUS_PIN, OUTPUT);
  motorStop();

  pinMode(REED_PIN, INPUT_PULLUP);
}

void loop() {
  int reedState = digitalRead(REED_PIN);

  if (reedState != lastReedState) {
    if (reedState == LOW) {
      Serial.println("[Reed] Door closed (magnet detected)");
    } else {
      Serial.println("[Reed] Door open (magnet away)");
    }
    lastReedState = reedState;
  }

  // If sequence finished (M- already sent), wait for a new badge
  if (sequenceFinished) {
    // no motor action until re-armed
  }

  if (!codeValid && !sequenceFinished) {
    if (!cardRequestDisplayed) {
      Serial.println("Present an RFID card (read NDEF text from block 4)");
      cardRequestDisplayed = true;
    }

    String cardContent = readCardContent();
    if (cardContent != "") {
      Serial.print("Data sent as 'code': ");
      Serial.println(cardContent);

      HTTPClient httpPost;
      httpPost.begin(djangoServer);
      httpPost.addHeader("Content-Type", "application/json");

      String json = "{\"code\": \"" + cardContent + "\", \"lock\": " + String(lockId) + "}";
      Serial.println("\nPOST payload:");
      Serial.println(json);

      int postCode = httpPost.POST(json);
      if (postCode > 0) {
        Serial.printf("HTTP code: %d\n", postCode);
        Serial.println("Server response:");
        Serial.println(httpPost.getString());
        if (postCode == 200) {
          Serial.println("Access granted!");
          codeValid  = true;
          doorOpened = false;

          // Access granted while door is still closed → engage handle (M+)
          if (reedState == LOW) { // LOW = door closed with INPUT_PULLUP
            pulseMotorPlus();
          }
        } else {
          Serial.println("Access denied!");
        }
      } else {
        Serial.printf("POST error: %s\n", httpPost.errorToString(postCode).c_str());
      }
      httpPost.end();
    }
  }

  if (codeValid && !sequenceFinished) {
    // Track door state
    if (reedState == HIGH) {
      doorOpened = true;
    }

    // Door open → wait 5s then disengage (M-) once
    if (doorOpened && reedState == HIGH) {
      Serial.println("Door open, waiting 5 s before M-");
      delay(5000);          // 5 seconds wait
      pulseMotorMinus();    // 1 s pulse on M- (disengage)

      // Sequence done, block until next badge
      sequenceFinished      = true;
      codeValid             = false;
      cardRequestDisplayed  = false;
    }
  }

  // Automatically re-arm when the door is closed again
  if (sequenceFinished && reedState == LOW) {
    Serial.println("Door closed again, system ready for a new badge.");
    sequenceFinished = false;
  }
}
