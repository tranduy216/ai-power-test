package com.carmanager.config

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.stereotype.Component
import org.springframework.web.servlet.HandlerInterceptor

@Component
class AuthInterceptor(private val jwtUtil: JwtUtil) : HandlerInterceptor {

    private val mapper = jacksonObjectMapper()

    override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
        val path = request.requestURI

        // Allow access to login page, static resources, and auth API
        if (path == "/login" || path == "/" ||
            path.startsWith("/css/") || path.startsWith("/js/") || path.startsWith("/webjars/") ||
            path == "/api/auth/login") {
            return true
        }

        // API routes use JWT authentication
        if (path.startsWith("/api/")) {
            val authHeader = request.getHeader("Authorization")
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                response.status = 401
                response.contentType = "application/json"
                response.writer.write(mapper.writeValueAsString(mapOf("error" to "Unauthorized")))
                return false
            }
            val token = authHeader.removePrefix("Bearer ").trim()
            if (!jwtUtil.validateToken(token)) {
                response.status = 401
                response.contentType = "application/json"
                response.writer.write(mapper.writeValueAsString(mapOf("error" to "Invalid or expired token")))
                return false
            }
            return true
        }

        // MVC routes use session authentication
        val session = request.getSession(false)
        if (session?.getAttribute("loggedInUser") == null) {
            response.sendRedirect("/login")
            return false
        }
        return true
    }
}
