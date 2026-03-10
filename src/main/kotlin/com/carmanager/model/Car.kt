package com.carmanager.model

data class Car(
    var id: Long = 0,
    var name: String = "",
    var brand: String = "",
    var year: Int = 2024,
    var color: String = ""
)
