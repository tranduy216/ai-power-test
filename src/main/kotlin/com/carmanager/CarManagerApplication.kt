package com.carmanager

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class CarManagerApplication

fun main(args: Array<String>) {
    runApplication<CarManagerApplication>(*args)
}
