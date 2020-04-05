void setup()
{
  Serial.begin(115200);
}

float i = 0;
String all_msg = "";
String Ary[2];
int _delay = 10;

void loop()
{
  // **** Signal example emit ****
  sendSignal(float(sin(i * 0.05) + 1), float(sin(i * 0.06) + 1), float(cos(i * 0.05) + 1), millis(), 0, 0.25);
  i++;
  // **** * ****

  // **** Read serial data example ****
  readData();
  // **** * ****

  delay(_delay);
}

/**
 * Send the changed data throught the serial port
 */
void mirror(String data[2])
{
  Serial.print(data[0]);
  Serial.print(",");
  Serial.print(data[1].toFloat());
  Serial.println();
}

/**
 * Send the sensors data throught the serial port
 */
void sendSignal(float pressure, float flow_ins, float flow_ex, float time, float ie, float frequency)
{
  Serial.print(pressure);
  Serial.print(",");
  Serial.print(flow_ins);
  Serial.print(",");
  Serial.print(flow_ex);
  Serial.print(",");
  Serial.print(time);
  Serial.print(",");
  Serial.print(ie);
  Serial.print(",");
  Serial.print(frequency);
  Serial.print(",");
  Serial.println();
}

/**
 * Read the change value of the variables in the UI throught the serial port
 */
void readData()
{

  String msg = "";
  int k = 0, j = 0;

  while (Serial.available())
  {
    delay(2); //delay to allow byte to arrive in input buffer
    char c = Serial.read();
    msg += c;
  }

  while (j < msg.length())
  {
    if (msg.charAt(j) == '\n')
    {
      if (Ary[0].equals("ie_ins"))
      {
        //TODO action
        mirror(Ary);
      }
      else if (Ary[0].equals("ie_ex"))
      {
        //TODO action
        mirror(Ary);
      }
      else if (Ary[0].equals("embolado"))
      {
        //TODO action
        mirror(Ary);
      }
      else if (Ary[0].equals("halt"))
      {
        //TODO action
        mirror(Ary);
      }
      else if (Ary[0].equals("volume_min"))
      {
        //TODO action
        mirror(Ary);
      }
      else if (Ary[0].equals("volume_max"))
      {
        //TODO action
        mirror(Ary);
      }
      else if (Ary[0].equals("pressure_min"))
      {
        //TODO action
        mirror(Ary);
      }
      else if (Ary[0].equals("pressure_max"))
      {
        //TODO action
        mirror(Ary);
      }
      Ary[0] = "";
      Ary[1] = "";
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
