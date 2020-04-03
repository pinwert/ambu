void setup() {
  Serial.begin(9600);
}
  float pressure = 0;
  float volume = 0;
  float i = 0;
  String all_msg = "";
  String Ary[100];
    
void loop() {
  unsigned long _delay = 10;

  while(true) {
    pressure = float(sin(i*0.05)+1);
    volume = float(cos(i*0.05)+1);
    Serial.print(pressure);
    Serial.print(",");
    Serial.print(volume);
    Serial.print(",");
    Serial.print(millis());
    Serial.print(",");
    Serial.print(0);
    Serial.print(",");
    Serial.print(0.25);
    Serial.print(",");
    Serial.println();
    i++;
    delay(_delay);
      
    int k = 0, j = 0, h = 0;
    String msg = "";
    while (Serial.available()) 
    {
      delay(2);  //delay to allow byte to arrive in input buffer
      char c = Serial.read();
      msg += c;
    }
    while ( j < msg.length())
    {
      if (msg.charAt(j) == '\n')
      {
        while (h <= k)
        {
          Serial.print(Ary[h]); //shows 1 2 3 4 5
          Serial.print(' ');
          Ary[h]="";
          h++;
        }
        Serial.println();
      }
      if (msg.charAt(j) == ',')
      {
        k++;
      }
      else
      {
        Ary[k] = Ary[k] + msg.charAt(j);
      }
      j++;
    }
  }
}