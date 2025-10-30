int ledPin = 3;  // Breathing LED
int redPin = 9;
int greenPin = 10;
int bluePin = 11;

volatile int mode = 0;  // 0 = off, 1 = Breathe, 2 = Static, 3 = Flash, 4 = Redcolor

void setup() {
    pinMode(ledPin, OUTPUT);
    pinMode(redPin, OUTPUT);
    pinMode(greenPin, OUTPUT);
    pinMode(bluePin, OUTPUT);
    Serial.begin(9600);
}

void loop() {
    if (Serial.available()) {
        char incoming = Serial.read();
        if (incoming >= '0' && incoming <= '4') {
            mode = incoming - '0';
        }
    }
    switch (mode) {
    case 0:
        off();
        break;
    case 1:
        // make green
        staticColor();
        break;
    case 2:
        // make yellow
        yellowLED();
        break;
    case 3:
        flashLED();
        break;
    case 4:
        redLED();
        break;
    }
}

void off() {
    analogWrite(ledPin, 0);
    analogWrite(redPin, 255);
    analogWrite(greenPin, 255);
    analogWrite(bluePin, 255);
    delay(1000);
}
// Flashing single LED on pin 3
void flashLED() {
    for (int i = 0; i < 5; i++) {  // Flash 5 times
        analogWrite(ledPin, 255);  // Off
        delay(200);
        analogWrite(ledPin, 0);  // Full brightness (common anode logic)
        delay(200);
    }
}

// Flashing RGB colors
void flashColors() {
    analogWrite(redPin, 0);
    analogWrite(greenPin, 255);
    analogWrite(bluePin, 255);
    delay(300);

    analogWrite(redPin, 255);
    analogWrite(greenPin, 0);
    analogWrite(bluePin, 255);
    delay(300);

    analogWrite(redPin, 255);
    analogWrite(greenPin, 255);
    analogWrite(bluePin, 0);
    delay(300);

    analogWrite(redPin, 0);
    analogWrite(greenPin, 0);
    analogWrite(bluePin, 0);
    delay(300);
}

// Breathing effect on single LED
void breatheLED() {
    for (int brightness = 0; brightness <= 255; brightness++) {
        analogWrite(redPin, 255 - brightness);
        analogWrite(greenPin, 255 - brightness);
        analogWrite(bluePin, 255 - brightness);
        analogWrite(ledPin, brightness);
        delay(5);
    }
    for (int brightness = 255; brightness >= 0; brightness--) {
        analogWrite(redPin, 255 - brightness);
        analogWrite(greenPin, 255 - brightness);
        analogWrite(bluePin, 255 - brightness);
        analogWrite(ledPin, brightness);
        delay(5);
    }
}

// Static RGB colors
void staticColor() {
    analogWrite(ledPin, 255);
    analogWrite(redPin, 0);
    analogWrite(greenPin, 0);
    analogWrite(bluePin, 0);
    delay(1000);
}

void redLED() {
    analogWrite(ledPin, 0);
    analogWrite(redPin, 0);
    analogWrite(greenPin, 255);
    analogWrite(bluePin, 255);
    delay(1000);
}

void greenLED() {
    analogWrite(ledPin, 0);
    analogWrite(redPin, 255);
    analogWrite(greenPin, 0);
    analogWrite(bluePin, 255);
    delay(1000);
}

void yellowLED() {
    analogWrite(ledPin, 0);
    analogWrite(redPin, 0);
    analogWrite(greenPin, 0);
    analogWrite(bluePin, 255);
    delay(1000);
}
