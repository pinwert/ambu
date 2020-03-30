void setup() {
  Serial.begin(9600);
}

void loop() {
  unsigned long _delay = 500;

  float pressure = 0;
  float volume = 0;
  float i = 0;

    while (true) {
      pressure = float(sin(i*0.05)+1);
      volume = float(cos(i*0.05)+1);
      Serial.print(pressure);
      Serial.write(",");
      Serial.print(volume);
      Serial.println();
      Serial.flush();
      i++;
      delay(_delay);
    }
}
