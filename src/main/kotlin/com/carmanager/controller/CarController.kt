package com.carmanager.controller

import com.carmanager.model.Car
import com.carmanager.repository.CarRepository
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.*
import jakarta.servlet.http.HttpSession

@Controller
@RequestMapping("/cars")
class CarController(private val carRepository: CarRepository) {

    @GetMapping
    fun listCars(
        @RequestParam(required = false) search: String?,
        model: Model,
        session: HttpSession
    ): String {
        val cars = if (!search.isNullOrBlank()) {
            carRepository.search(search)
        } else {
            carRepository.findAll()
        }
        model.addAttribute("cars", cars)
        model.addAttribute("search", search ?: "")
        model.addAttribute("fullName", session.getAttribute("fullName") ?: "")
        return "cars/list"
    }

    @GetMapping("/add")
    fun addCarForm(model: Model): String {
        model.addAttribute("car", Car())
        model.addAttribute("action", "Add")
        return "cars/form"
    }

    @PostMapping("/add")
    fun addCar(@ModelAttribute car: Car): String {
        carRepository.save(car)
        return "redirect:/cars"
    }

    @GetMapping("/edit/{id}")
    fun editCarForm(@PathVariable id: Long, model: Model): String {
        val car = carRepository.findById(id) ?: return "redirect:/cars"
        model.addAttribute("car", car)
        model.addAttribute("action", "Edit")
        return "cars/form"
    }

    @PostMapping("/edit/{id}")
    fun editCar(@PathVariable id: Long, @ModelAttribute car: Car): String {
        car.id = id
        carRepository.save(car)
        return "redirect:/cars"
    }

    @GetMapping("/delete/{id}")
    fun deleteCar(@PathVariable id: Long): String {
        carRepository.deleteById(id)
        return "redirect:/cars"
    }
}
