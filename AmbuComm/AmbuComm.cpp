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
    while (!Serial)
    {
        ;
    }
}

void AmbuComm::send(float pressure, float volume, float time, float ie, float frequency)
{
    if (Serial.available())
    {
        Serial.print(pressure);
        Serial.print(",");
        Serial.print(volume);
        Serial.print(",");
        Serial.print(time);
        Serial.print(",");
        Serial.print(ie);
        Serial.print(",");
        Serial.print(frequency);
        Serial.println();
        Serial.flush();
    }
}