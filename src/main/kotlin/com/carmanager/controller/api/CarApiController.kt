package com.carmanager.controller.api

import com.carmanager.model.Car
import com.carmanager.repository.CarRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/cars")
class CarApiController(private val carRepository: CarRepository) {

    @GetMapping
    fun listCars(@RequestParam(required = false) search: String?): ResponseEntity<List<Car>> {
        val cars = if (!search.isNullOrBlank()) {
            carRepository.search(search)
        } else {
            carRepository.findAll()
        }
        return ResponseEntity.ok(cars)
    }

    @GetMapping("/{id}")
    fun getCar(@PathVariable id: Long): ResponseEntity<Any> {
        val car = carRepository.findById(id)
            ?: return ResponseEntity.status(404).body(mapOf("error" to "Car not found"))
        return ResponseEntity.ok(car)
    }

    @PostMapping
    fun createCar(@RequestBody car: Car): ResponseEntity<Car> {
        car.id = 0
        val saved = carRepository.save(car)
        return ResponseEntity.status(201).body(saved)
    }

    @PutMapping("/{id}")
    fun updateCar(@PathVariable id: Long, @RequestBody car: Car): ResponseEntity<Any> {
        carRepository.findById(id)
            ?: return ResponseEntity.status(404).body(mapOf("error" to "Car not found"))
        car.id = id
        val saved = carRepository.save(car)
        return ResponseEntity.ok(saved)
    }

    @DeleteMapping("/{id}")
    fun deleteCar(@PathVariable id: Long): ResponseEntity<Any> {
        val deleted = carRepository.deleteById(id)
        return if (deleted) {
            ResponseEntity.ok(mapOf("message" to "Car deleted successfully"))
        } else {
            ResponseEntity.status(404).body(mapOf("error" to "Car not found"))
        }
    }
}
