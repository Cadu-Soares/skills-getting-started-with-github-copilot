document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load activities");
      }
      const activities = await response.json();

      // Clear loading message and reset activity dropdown
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-title"><strong>Participants (${details.participants.length}/${details.max_participants}):</strong></p>
          </div>
        `;

        const participantsSection = activityCard.querySelector(".participants-section");

        if (details.participants.length > 0) {
          const participantsList = document.createElement("ul");

          details.participants.forEach((participant) => {
            const participantItem = document.createElement("li");
            const nameSpan = document.createElement("span");
            nameSpan.textContent = participant;
            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "remove-participant";
            removeButton.textContent = "×";
            removeButton.dataset.activity = name;
            removeButton.dataset.email = participant;

            participantItem.appendChild(nameSpan);
            participantItem.appendChild(removeButton);
            participantsList.appendChild(participantItem);
          });

          participantsSection.appendChild(participantsList);
        } else {
          const noParticipants = document.createElement("p");
          noParticipants.className = "no-participants";
          noParticipants.innerHTML = "<em>No participants yet</em>";
          participantsSection.appendChild(noParticipants);
        }

        activitiesList.appendChild(activityCard);

        const removeButtons = activityCard.querySelectorAll(".remove-participant");
        removeButtons.forEach((button) => {
          button.addEventListener("click", async () => {
            const participantEmail = button.dataset.email;
            const activityName = button.dataset.activity;

            try {
              const deleteResponse = await fetch(
                `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(participantEmail)}`,
                { method: "DELETE" }
              );

              const deleteResult = await deleteResponse.json();

              if (deleteResponse.ok) {
                messageDiv.textContent = deleteResult.message;
                messageDiv.className = "success";
                await fetchActivities();
              } else {
                messageDiv.textContent = deleteResult.detail || "Failed to remove participant";
                messageDiv.className = "error";
              }

              messageDiv.classList.remove("hidden");
              setTimeout(() => {
                messageDiv.classList.add("hidden");
              }, 5000);
            } catch (deleteError) {
              messageDiv.textContent = "Failed to remove participant. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              console.error("Error removing participant:", deleteError);
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
