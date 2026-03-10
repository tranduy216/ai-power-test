package com.carmanager.repository

import com.carmanager.model.Account
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Repository
import jakarta.annotation.PostConstruct

@Repository
class AccountRepository {

    private val mapper = jacksonObjectMapper()
    private val accounts = mutableListOf<Account>()

    @PostConstruct
    fun init() {
        val resource = ClassPathResource("accounts.json")
        val jsonContent = resource.inputStream.bufferedReader().readText()
        accounts.addAll(mapper.readValue<List<Account>>(jsonContent))
    }

    fun findByUsername(username: String): Account? =
        accounts.find { it.username == username }

    fun authenticate(username: String, password: String): Account? =
        accounts.find { it.username == username && it.password == password }
}
