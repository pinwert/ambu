/*
  AmbuComm.cpp - Library for communicating with AmbuApp
  Created by Enrique Piña Monserrat, March 28, 2020
  Released into the public domain.
*/

#include "Arduino.h"
#include "AmbuComm.h"

AmbuComm::AmbuComm(int baudios)
{
    Serial.begin(baudios);
}

void AmbuComm::send(float pressure, float volume, float time, float ie, float frequency)
{
    if (Serial.available())
    {
        Serial.print(pressure);
        Serial.write(",");
        Serial.print(volume);
        Serial.write(",");
        Serial.print(time);
        Serial.write(",");
        Serial.print(ie);
        Serial.write(",");
        Serial.print(frequency);
        Serial.write(",");
        Serial.println();
        Serial.flush();
    }
}
