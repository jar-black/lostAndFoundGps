package com.lostandfound.api

import com.lostandfound.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("api/things")
    suspend fun createThing(@Body request: CreateThingRequest): Response<ThingResponse>

    @GET("api/things/nearby")
    suspend fun getNearbyThings(
        @Query("lat") latitude: Double,
        @Query("lng") longitude: Double,
        @Query("radius") radius: Int = 1000
    ): Response<ThingResponse>

    @GET("api/things/{id}")
    suspend fun getThingById(@Path("id") id: String): Response<ThingResponse>

    @GET("api/things/my-things")
    suspend fun getMyThings(): Response<ThingResponse>

    @PUT("api/things/{id}")
    suspend fun updateThing(
        @Path("id") id: String,
        @Body updates: Map<String, Any>
    ): Response<ThingResponse>

    @DELETE("api/things/{id}")
    suspend fun deleteThing(@Path("id") id: String): Response<MessageResponse>

    @POST("api/things/{id}/contact")
    suspend fun contactOwner(
        @Path("id") id: String,
        @Body request: ContactRequest
    ): Response<MessageResponse>
}
