package com.carmanager.repository

import com.carmanager.model.Car
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Repository
import java.io.File
import java.nio.file.Files
import jakarta.annotation.PostConstruct

@Repository
class CarRepository {

    private val mapper = jacksonObjectMapper()
    private val cars = mutableListOf<Car>()
    private var dataFile: File? = null

    @PostConstruct
    fun init() {
        val resource = ClassPathResource("cars.json")
        val jsonContent = resource.inputStream.bufferedReader().readText()
        cars.addAll(mapper.readValue<List<Car>>(jsonContent))

        // Create a writable copy in temp directory for persistence during runtime
        dataFile = Files.createTempFile("cars", ".json").toFile()
        saveToFile()
    }

    fun findAll(): List<Car> = cars.toList()

    fun findById(id: Long): Car? = cars.find { it.id == id }

    fun search(keyword: String): List<Car> {
        val lower = keyword.lowercase()
        return cars.filter {
            it.name.lowercase().contains(lower) ||
            it.brand.lowercase().contains(lower) ||
            it.year.toString().contains(lower) ||
            it.color.lowercase().contains(lower)
        }
    }

    fun save(car: Car): Car {
        if (car.id == 0L) {
            car.id = (cars.maxOfOrNull { it.id } ?: 0) + 1
            cars.add(car)
        } else {
            val index = cars.indexOfFirst { it.id == car.id }
            if (index >= 0) {
                cars[index] = car
            } else {
                cars.add(car)
            }
        }
        saveToFile()
        return car
    }

    fun deleteById(id: Long): Boolean {
        val removed = cars.removeIf { it.id == id }
        if (removed) saveToFile()
        return removed
    }

    private fun saveToFile() {
        dataFile?.let { mapper.writerWithDefaultPrettyPrinter().writeValue(it, cars) }
    }
}
