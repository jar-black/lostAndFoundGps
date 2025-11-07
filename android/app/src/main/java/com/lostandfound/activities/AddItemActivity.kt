package com.lostandfound.activities

import android.Manifest
import android.content.pm.PackageManager
import android.location.Location
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.lostandfound.api.ApiClient
import com.lostandfound.databinding.ActivityAddItemBinding
import com.lostandfound.models.CreateThingRequest
import com.lostandfound.utils.TokenManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class AddItemActivity : AppCompatActivity() {
    private lateinit var binding: ActivityAddItemBinding
    private lateinit var tokenManager: TokenManager
    private lateinit var apiService: com.lostandfound.api.ApiService
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private var currentLocation: Location? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAddItemBinding.inflate(layoutInflater)
        setContentView(binding.root)

        tokenManager = TokenManager(this)
        apiService = ApiClient.create(tokenManager)
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        getCurrentLocation()
        setupListeners()
    }

    private fun setupListeners() {
        binding.btnSubmit.setOnClickListener {
            val headline = binding.etHeadline.text.toString().trim()
            val description = binding.etDescription.text.toString().trim()

            if (validateInput(headline, description)) {
                createItem(headline, description)
            }
        }

        binding.btnCancel.setOnClickListener {
            finish()
        }
    }

    private fun validateInput(headline: String, description: String): Boolean {
        if (headline.isEmpty()) {
            binding.etHeadline.error = "Headline is required"
            return false
        }

        if (description.isEmpty()) {
            binding.etDescription.error = "Description is required"
            return false
        }

        if (currentLocation == null) {
            Toast.makeText(this, "Location not available", Toast.LENGTH_SHORT).show()
            return false
        }

        return true
    }

    private fun getCurrentLocation() {
        if (ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            fusedLocationClient.lastLocation.addOnSuccessListener { location: Location? ->
                if (location != null) {
                    currentLocation = location
                    binding.tvLocation.text = "Lat: ${location.latitude}, Lng: ${location.longitude}"
                } else {
                    Toast.makeText(this, "Unable to get location", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun createItem(headline: String, description: String) {
        val location = currentLocation
        if (location == null) {
            Toast.makeText(this, "Location not available", Toast.LENGTH_SHORT).show()
            return
        }

        binding.btnSubmit.isEnabled = false
        binding.btnSubmit.text = "Adding..."

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val request = CreateThingRequest(
                    headline,
                    description,
                    location.latitude,
                    location.longitude
                )
                val response = apiService.createThing(request)

                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        Toast.makeText(
                            this@AddItemActivity,
                            "Item added successfully!",
                            Toast.LENGTH_SHORT
                        ).show()
                        finish()
                    } else {
                        val errorMessage = when (response.code()) {
                            429 -> "Rate limit exceeded. You can only add 5 items per week."
                            else -> "Failed to add item: ${response.message()}"
                        }
                        Toast.makeText(
                            this@AddItemActivity,
                            errorMessage,
                            Toast.LENGTH_LONG
                        ).show()
                        binding.btnSubmit.isEnabled = true
                        binding.btnSubmit.text = "Add Item"
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@AddItemActivity,
                        "Error: ${e.message}",
                        Toast.LENGTH_LONG
                    ).show()
                    binding.btnSubmit.isEnabled = true
                    binding.btnSubmit.text = "Add Item"
                }
            }
        }
    }
}
