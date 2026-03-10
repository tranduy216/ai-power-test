package com.carmanager.controller.api

import com.carmanager.config.JwtUtil
import com.carmanager.repository.AccountRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

data class LoginRequest(val username: String, val password: String)
data class LoginResponse(val token: String, val fullName: String)
data class UserResponse(val username: String, val fullName: String)

@RestController
@RequestMapping("/api/auth")
class AuthApiController(
    private val accountRepository: AccountRepository,
    private val jwtUtil: JwtUtil
) {

    @PostMapping("/login")
    fun login(@RequestBody request: LoginRequest): ResponseEntity<Any> {
        val account = accountRepository.authenticate(request.username, request.password)
            ?: return ResponseEntity.status(401).body(mapOf("error" to "Invalid username or password"))

        val token = jwtUtil.generateToken(account.username, account.fullName)
        return ResponseEntity.ok(LoginResponse(token, account.fullName))
    }

    @GetMapping("/me")
    fun me(@RequestHeader("Authorization") authHeader: String): ResponseEntity<Any> {
        val token = authHeader.removePrefix("Bearer ").trim()
        val username = jwtUtil.getUsername(token)
            ?: return ResponseEntity.status(401).body(mapOf("error" to "Invalid token"))
        val fullName = jwtUtil.getFullName(token) ?: ""
        return ResponseEntity.ok(UserResponse(username, fullName))
    }
}
