package com.carmanager.config

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.stereotype.Component
import org.springframework.web.servlet.HandlerInterceptor

@Component
class AuthInterceptor : HandlerInterceptor {

    override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
        val path = request.requestURI
        // Allow access to login page and static resources
        if (path == "/login" || path.startsWith("/css/") || path.startsWith("/js/")) {
            return true
        }
        val session = request.getSession(false)
        if (session?.getAttribute("loggedInUser") == null) {
            response.sendRedirect("/login")
            return false
        }
        return true
    }
}
