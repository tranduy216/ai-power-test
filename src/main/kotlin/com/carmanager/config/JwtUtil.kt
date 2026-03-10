package com.carmanager.config

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Component
import java.util.Date
import javax.crypto.SecretKey

@Component
class JwtUtil {

    private val secretKey: SecretKey = Keys.hmacShaKeyFor(
        "car-manager-secret-key-must-be-at-least-256-bits-long!!".toByteArray()
    )
    private val expirationMs: Long = 86400000 // 24 hours

    fun generateToken(username: String, fullName: String): String {
        return Jwts.builder()
            .subject(username)
            .claim("fullName", fullName)
            .issuedAt(Date())
            .expiration(Date(System.currentTimeMillis() + expirationMs))
            .signWith(secretKey)
            .compact()
    }

    fun validateToken(token: String): Boolean {
        return try {
            Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token)
            true
        } catch (e: Exception) {
            false
        }
    }

    fun getUsername(token: String): String? {
        return try {
            Jwts.parser().verifyWith(secretKey).build()
                .parseSignedClaims(token).payload.subject
        } catch (e: Exception) {
            null
        }
    }

    fun getFullName(token: String): String? {
        return try {
            Jwts.parser().verifyWith(secretKey).build()
                .parseSignedClaims(token).payload["fullName"] as? String
        } catch (e: Exception) {
            null
        }
    }
}
