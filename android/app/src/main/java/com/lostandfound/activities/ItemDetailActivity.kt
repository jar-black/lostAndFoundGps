package com.lostandfound.activities

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.lostandfound.api.ApiClient
import com.lostandfound.databinding.ActivityItemDetailBinding
import com.lostandfound.models.ContactRequest
import com.lostandfound.utils.TokenManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class ItemDetailActivity : AppCompatActivity() {
    private lateinit var binding: ActivityItemDetailBinding
    private lateinit var tokenManager: TokenManager
    private lateinit var apiService: com.lostandfound.api.ApiService
    private lateinit var thingId: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityItemDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        tokenManager = TokenManager(this)
        apiService = ApiClient.create(tokenManager)

        // Get data from intent
        thingId = intent.getStringExtra("thing_id") ?: ""
        val headline = intent.getStringExtra("thing_headline") ?: ""
        val description = intent.getStringExtra("thing_description") ?: ""

        // Display data
        binding.tvHeadline.text = headline
        binding.tvDescription.text = description

        setupListeners()
    }

    private fun setupListeners() {
        binding.btnContact.setOnClickListener {
            showContactDialog()
        }

        binding.btnClose.setOnClickListener {
            finish()
        }
    }

    private fun showContactDialog() {
        val input = android.widget.EditText(this)
        input.hint = "Enter your message"
        input.minLines = 3

        AlertDialog.Builder(this)
            .setTitle("Contact Owner")
            .setMessage("Send an anonymous message to the item owner:")
            .setView(input)
            .setPositiveButton("Send") { _, _ ->
                val message = input.text.toString().trim()
                if (message.isNotEmpty()) {
                    sendContactMessage(message)
                } else {
                    Toast.makeText(this, "Message cannot be empty", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun sendContactMessage(message: String) {
        binding.btnContact.isEnabled = false

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = apiService.contactOwner(thingId, ContactRequest(message))

                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        Toast.makeText(
                            this@ItemDetailActivity,
                            "Message sent successfully!",
                            Toast.LENGTH_SHORT
                        ).show()
                    } else {
                        Toast.makeText(
                            this@ItemDetailActivity,
                            "Failed to send message",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                    binding.btnContact.isEnabled = true
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@ItemDetailActivity,
                        "Error: ${e.message}",
                        Toast.LENGTH_LONG
                    ).show()
                    binding.btnContact.isEnabled = true
                }
            }
        }
    }
}
