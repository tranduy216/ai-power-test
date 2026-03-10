package com.carmanager.controller

import com.carmanager.repository.AccountRepository
import jakarta.servlet.http.HttpSession
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestParam

@Controller
class AuthController(private val accountRepository: AccountRepository) {

    @GetMapping("/login")
    fun loginPage(session: HttpSession): String {
        if (session.getAttribute("loggedInUser") != null) {
            return "redirect:/cars"
        }
        return "login"
    }

    @PostMapping("/login")
    fun login(
        @RequestParam username: String,
        @RequestParam password: String,
        session: HttpSession,
        model: Model
    ): String {
        val account = accountRepository.authenticate(username, password)
        if (account != null) {
            session.setAttribute("loggedInUser", account.username)
            session.setAttribute("fullName", account.fullName)
            return "redirect:/cars"
        }
        model.addAttribute("error", "Invalid username or password")
        return "login"
    }

    @GetMapping("/logout")
    fun logout(session: HttpSession): String {
        session.invalidate()
        return "redirect:/login"
    }
}
