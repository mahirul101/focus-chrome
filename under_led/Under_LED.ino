int whitePin = 3;  // Breathing LED
int redPin = 9;
int greenPin = 10;
int bluePin = 11;

volatile int mode = 0;
volatile bool loop_mode = true;
// 0 = off
// 1 = Green
// 2 = Yellow
// 3 = Red
// 4 = Breathe
// 5 = Flash
// 6 = Rainbow
// 7 = White

void setup() {
    pinMode(whitePin, OUTPUT);
    pinMode(redPin, OUTPUT);
    pinMode(greenPin, OUTPUT);
    pinMode(bluePin, OUTPUT);
    Serial.begin(9600);
}

void loop() {
    if (Serial.available()) {
        char incoming = Serial.read();
        if (incoming >= '0' && incoming <= '7') {
            mode = incoming - '0';
            loop_mode = true;
        }
    }
    if (loop_mode) {
      loop_mode = false;
      switch (mode) {
      case 0:
          off();
          break;
      case 1:
          green();
          break;
      case 2:
          yellow();
          break;
      case 3:
          red();
          break;
      case 4:
          loop_mode = true;
          breathe();
          break;
      case 5:
          loop_mode = true;
          flash();
          break;
      case 6:
          loop_mode = true;
          rainbow();
          break;
      case 7:
          white();
          break;
      }
    }
}

void off() {
    analogWrite(whitePin, 0);
    analogWrite(redPin, 255);
    analogWrite(greenPin, 255);
    analogWrite(bluePin, 255);
}

void flash() {
    //off
    analogWrite(whitePin, 0);
    analogWrite(redPin, 255);
    analogWrite(greenPin, 255);
    analogWrite(bluePin, 255);
    delay(200);

    //On
    analogWrite(whitePin, 255);
    analogWrite(redPin, 0);
    analogWrite(greenPin, 0);
    analogWrite(bluePin, 0);
    delay(200);
}

void fade() {
    for (int i = 255; i>=0; i--){
        analogWrite(redPin, i);
        analogWrite(greenPin, i);
        analogWrite(bluePin, i);
        delay(10);
    }
}

void HSVtoRGB(float h, float s, float v, float &r, float &g, float &b) {
  int i = int(h / 60.0) % 6;
  float f = (h / 60.0) - i;
  float p = v * (1 - s);
  float q = v * (1 - f * s);
  float t = v * (1 - (1 - f) * s);

  switch (i) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
}

void rainbow(){
  for (int hue = 0; hue < 360; hue++) {
      float r, g, b;
      HSVtoRGB(hue, 1.0, 1.0, r, g, b);
      analogWrite(redPin, int(r * 255));
      analogWrite(greenPin, int(g * 255));
      analogWrite(bluePin, int(b * 255));
      delay(10);
  }
}

void breathe() {
    for (int brightness = 0; brightness <= 255; brightness++) {
        analogWrite(redPin, 255 - brightness);
        analogWrite(greenPin, 255 - brightness);
        analogWrite(bluePin, 255 - brightness);
        analogWrite(whitePin, brightness);
        delay(5);
    }
    for (int brightness = 255; brightness >= 0; brightness--) {
        analogWrite(redPin, 255 - brightness);
        analogWrite(greenPin, 255 - brightness);
        analogWrite(bluePin, 255 - brightness);
        analogWrite(whitePin, brightness);
        delay(5);
    }
}

void white() {
    analogWrite(whitePin, 255);
    analogWrite(redPin, 0);
    analogWrite(greenPin, 0);
    analogWrite(bluePin, 0);
}

void red() {
    analogWrite(whitePin, 0);
    analogWrite(redPin, 0);
    analogWrite(greenPin, 255);
    analogWrite(bluePin, 255);
}

void green() {
    analogWrite(whitePin, 0);
    analogWrite(redPin, 255);
    analogWrite(greenPin, 0);
    analogWrite(bluePin, 255);
}

void blue() {
    analogWrite(whitePin, 0);
    analogWrite(redPin, 255);
    analogWrite(greenPin, 255);
    analogWrite(bluePin, 0);
}
void yellow() {
    analogWrite(whitePin, 0);
    analogWrite(redPin, 0);
    analogWrite(greenPin, 0);
    analogWrite(bluePin, 255);
}
