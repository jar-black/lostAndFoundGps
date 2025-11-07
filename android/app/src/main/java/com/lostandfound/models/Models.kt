package com.lostandfound.models

import com.google.gson.annotations.SerializedName

// Request models
data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val email: String,
    val password: String
)

data class CreateThingRequest(
    val headline: String,
    val description: String,
    val latitude: Double,
    val longitude: Double
)

data class ContactRequest(
    val message: String
)

// Response models
data class AuthResponse(
    val message: String,
    val token: String,
    val user: User
)

data class User(
    val id: String,
    val email: String,
    @SerializedName("created_at")
    val createdAt: String
)

data class Thing(
    val id: String,
    @SerializedName("user_id")
    val userId: String,
    val headline: String,
    val description: String,
    val latitude: Double,
    val longitude: Double,
    @SerializedName("contact_email")
    val contactEmail: String,
    @SerializedName("created_at")
    val createdAt: String,
    val status: String,
    val distance: Double? = null
)

data class ThingResponse(
    val message: String? = null,
    val thing: Thing? = null,
    val things: List<Thing>? = null,
    val count: Int? = null
)

data class MessageResponse(
    val message: String
)

data class ErrorResponse(
    val error: String
)
