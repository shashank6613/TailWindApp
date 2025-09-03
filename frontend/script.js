document.addEventListener('DOMContentLoaded', function() {
    // API URL - Replace with your actual backend API endpoint
    const API_URL = '/app/api';

    // Indian states and cities data
    const indianStatesAndCities = {
        "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"],
        "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro"],
        "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"],
        "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"],
        "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
        "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
        "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
        "Haryana": ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar"],
        "Himachal Pradesh": ["Shimla", "Mandi", "Dharamshala", "Solan", "Nahan"],
        "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribada"],
        "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum"],
        "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
        "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain"],
        "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"],
        "Manipur": ["Imphal", "Thoubal", "Kakching", "Ukhrul", "Chandel"],
        "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongstoin", "Baghmara"],
        "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib"],
        "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha"],
        "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur"],
        "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
        "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer"],
        "Sikkim": ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Rangpo"],
        "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
        "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Ramagundam"],
        "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Belonia"],
        "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi"],
        "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur"],
        "West Bengal": ["Kolkata", "Asansol", "Siliguri", "Durgapur", "Bardhaman"],
        "Delhi": ["New Delhi", "Delhi", "Noida", "Gurgaon", "Faridabad"]
    };

    // Populate state dropdowns (form and search)
    const stateDropdowns = [
        document.getElementById('state'),
        document.getElementById('searchState'),
        document.getElementById('filterState') // New: for All Users page
    ];
    Object.keys(indianStatesAndCities).sort().forEach(state => {
        stateDropdowns.forEach(dropdown => {
            if (dropdown) { // Check if element exists before appending
                const option = document.createElement('option');
                option.value = state;
                option.textContent = state;
                dropdown.appendChild(option.cloneNode(true)); // Clone for each dropdown
            }
        });
    });

    // Update city dropdown when state is selected (form and All Users page)
    const cityDropdowns = {
        'city': document.getElementById('city'),
        'filterCity': document.getElementById('filterCity') // New: for All Users page
    };

    function updateCityDropdown(selectedState, citySelectElement) {
        // Clear existing options, keep default "Select City" or "All Cities"
        citySelectElement.innerHTML = citySelectElement.id === 'city' ?
            '<option value="">Select City</option>' :
            '<option value="">All Cities</option>';

        if (selectedState) {
            const cities = indianStatesAndCities[selectedState];
            cities.sort().forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelectElement.appendChild(option);
            });
        }
    }

    // Attach change listeners to state dropdowns that affect city dropdowns
    document.getElementById('state').addEventListener('change', function() {
        updateCityDropdown(this.value, cityDropdowns['city']);
    });
    document.getElementById('filterState').addEventListener('change', function() {
        updateCityDropdown(this.value, cityDropdowns['filterCity']);
    });


    // Toggle advanced search options
    const advancedSearchToggle = document.getElementById('advancedSearchToggle');
    const advancedSearchOptions = document.getElementById('advancedSearchOptions');

    if (advancedSearchToggle) {
        advancedSearchToggle.addEventListener('click', function() {
            advancedSearchOptions.classList.toggle('hidden');
            // Change the icon and text based on visibility
            if (advancedSearchOptions.classList.contains('hidden')) {
                this.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Advanced Search
                `;
            } else {
                this.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" />
                    </svg>
                    Hide Advanced Search
                `;
            }
        });
    }

    // Navigation between pages
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const userInfoForm = document.getElementById('userInfoForm');
    const submissionSuccess = document.getElementById('submissionSuccess');
    const allUsersTableContainer = document.getElementById('allUsersTableContainer'); // New

    function attachNavEventListeners() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetPage = this.getAttribute('data-page');

                pages.forEach(page => {
                    page.classList.remove('active');
                });
                document.getElementById(targetPage).classList.add('active');

                // Update active nav link
                navLinks.forEach(navLink => {
                    if (navLink.getAttribute('data-page') === targetPage) {
                        navLink.classList.add('text-blue-600');
                        navLink.classList.remove('text-gray-600', 'hover:text-blue-600');
                    } else {
                        navLink.classList.remove('text-blue-600');
                        navLink.classList.add('text-gray-600', 'hover:text-blue-600');
                    }
                });

                // Specific logic for the form page
                if (targetPage === 'form') {
                    userInfoForm.classList.remove('hidden'); // Show the form
                    userInfoForm.reset(); // Reset form fields
                    submissionSuccess.classList.add('hidden'); // Hide success message
                } else {
                    // When navigating away from the form, ensure success message is hidden
                    submissionSuccess.classList.add('hidden');
                }

                // Specific logic for All Users page
                if (targetPage === 'allUsers') {
                    // Reset filters
                    document.getElementById('filterState').value = '';
                    document.getElementById('filterCity').value = '';
                    document.getElementById('filterEducation').value = '';
                    document.getElementById('filterOrgType').value = '';
                    document.getElementById('filterSource').value = '';
                    updateCityDropdown('', cityDropdowns['filterCity']); // Clear city dropdown

                    // Automatically fetch and display all users when navigating to this page
                    fetchAndDisplayAllUsers();
                }

                // Scroll to top
                window.scrollTo(0, 0);
            });
        });
    }

    attachNavEventListeners();

    // Form submission
    const form = document.getElementById('userInfoForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            // Collect form data
            const formData = new FormData(form);
            const userData = {};
            formData.forEach((value, key) => {
                userData[key] = value;
            });
            // Add newsletter boolean
            userData.newsletter = formData.has('newsletter');

            // Declare the button and its text outside the try block
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;

            try {
                // Show loading state
                submitBtn.disabled = true;
                submitBtn.innerHTML = `
                    <div class="flex items-center justify-center">
                        <div class="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                        Submitting...
                    </div>
                `;

                // Send data to server
                const response = await fetch(`${API_URL}/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData),
                });

                if (!response.ok) {
                    // This line now correctly handles the 404
                    throw new Error('Network response was not ok');
                }

                const result = await response.json();
                console.log('User saved:', result);

                // Hide the form and show the success message
                userInfoForm.classList.add('hidden');
                submissionSuccess.classList.remove('hidden');

                // Reset button state (though it's hidden now, good practice)
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;

            } catch (error) {
                console.error('Error:', error);
                // We'll use a safer way to alert the user
                showCustomAlert('There was a problem submitting your information. Please try again.');
            
                // This line now works because originalBtnText is in scope
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // Search functionality (existing)
    const searchForm = document.getElementById('searchForm');
    const searchResults = document.getElementById('searchResults');

    if (searchForm) {
        searchForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const query = document.getElementById('searchQuery').value;
            const searchType = document.getElementById('searchType').value;
            const searchState = document.getElementById('searchState').value;
            const searchEducation = document.getElementById('searchEducation').value;
            const searchOrgType = document.getElementById('searchOrgType').value;
            const searchNewsletter = document.getElementById('searchNewsletter').value;

            // Show loading state
            searchResults.innerHTML = `
                <div class="text-center py-8">
                    <div class="loading mx-auto mb-4"></div>
                    <p class="text-lg text-gray-600">Searching for users...</p>
                </div>
            `;

            // Build query string
            const params = new URLSearchParams();
            if (query) params.append('searchQuery', query);
            if (searchType) params.append('searchType', searchType);
            if (searchState) params.append('state', searchState);
            if (searchEducation) params.append('education', searchEducation);
            if (searchOrgType) params.append('orgType', searchOrgType);
            if (searchNewsletter) params.append('newsletter', searchNewsletter);

            try {
                const response = await fetch(`${API_URL}/users/search?${params.toString()}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const results = await response.json();
                // Display results
                displaySearchResults(results);
            } catch (error) {
                console.error('Error:', error);
                searchResults.innerHTML = `
                    <div class="text-center text-red-500 py-8">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p class="text-lg">Error searching for users. Please try again.</p>
                    </div>
                `;
            }
        });
    }

    function displaySearchResults(users) {
        searchResults.innerHTML = ''; // Clear previous results

        if (users.length === 0) {
            searchResults.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-lg">No users found matching your criteria.</p>
                </div>
            `;
            return;
        }

        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.classList.add('search-result', 'bg-gray-50', 'rounded-xl', 'p-6', 'border', 'border-gray-200');
            userCard.innerHTML = `
                <div class="flex items-center mb-4">
                    <div class="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800">${user.firstName || ''} ${user.lastName || ''}</h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Email: ${user.email || 'N/A'}</span>
                    </div>
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684L10.707 9l-2.558 2.558A15.928 15.928 0 0012 18.001o-.025.025C2.414 12.414 2 11.282 2 10V5z" />
                        </svg>
                        <span>Phone: ${user.phone || 'N/A'}</span>
                    </div>
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>Organization: ${user.organization || 'N/A'}</span>
                    </div>
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                        </svg>
                        <span>Org Type: ${user.orgType || 'N/A'}</span>
                    </div>
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253" />
                        </svg>
                        <span>Education: ${user.education || 'N/A'}</span>
                    </div>
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Location: ${user.homeLocation || 'N/A'}</span>
                    </div>
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17v2a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2h2m2 14h4m-4 0h-.01M12 7v4m0 0v4m0-4h4m-4 0h-.01M6 21h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span class="text-gray-600">Newsletter: ${user.newsletter ? 'Subscribed' : 'Not subscribed'}</span>
                    </div>
                </div>
            `;
            searchResults.appendChild(userCard);
        });
    }

    // NEW: All Users Page Functionality
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', fetchAndDisplayAllUsers);
    }

    async function fetchAndDisplayAllUsers() {
        const filterState = document.getElementById('filterState').value;
        const filterCity = document.getElementById('filterCity').value;
        const filterEducation = document.getElementById('filterEducation').value;
        const filterOrgType = document.getElementById('filterOrgType').value;
        const filterSource = document.getElementById('filterSource').value;

        // Build query string for filters
        const params = new URLSearchParams();
        if (filterState) params.append('state', filterState);
        if (filterCity) params.append('city', filterCity);
        if (filterEducation) params.append('education', filterEducation);
        if (filterOrgType) params.append('orgType', filterOrgType);
        if (filterSource) params.append('source', filterSource);

        allUsersTableContainer.innerHTML = `
            <div class="text-center py-8">
                <div class="loading mx-auto mb-4"></div>
                <p class="text-lg text-gray-600">Loading users...</p>
            </div>
        `;

        try {
            // Adjust the API endpoint if your backend has a dedicated endpoint for fetching all users with filters
            // For now, assuming a /users endpoint that accepts query parameters for filtering
            const response = await fetch(`${API_URL}/users?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const users = await response.json();
            displayUsersTable(users);
        } catch (error) {
            console.error('Error fetching all users:', error);
            allUsersTableContainer.innerHTML = `
                <div class="text-center text-red-500 py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-lg">Error loading user data. Please try again.</p>
                </div>
            `;
        }
    }

    function displayUsersTable(users) {
        allUsersTableContainer.innerHTML = ''; // Clear previous content

        if (users.length === 0) {
            allUsersTableContainer.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-lg">No users found matching the selected filters.</p>
                </div>
            `;
            return;
        }

        const table = document.createElement('table');
        table.classList.add('min-w-full', 'bg-white'); // Tailwind classes for styling

        // Table Header
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        const headers = [
            'Name', 'Email', 'Phone', 'Organization', 'Org Type',
            'Education', 'Location', 'State', 'City', 'Newsletter', 'Heard Via'
        ];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            th.classList.add('px-4', 'py-3', 'bg-gray-100', 'text-gray-800', 'text-sm', 'font-semibold', 'uppercase', 'tracking-wider');
            headerRow.appendChild(th);
        });

        // Table Body
        const tbody = table.createTBody();
        users.forEach(user => {
            const row = tbody.insertRow();
            row.classList.add('hover:bg-gray-50'); // Hover effect

            const cells = [
                `${user.firstName || ''} ${user.lastName || ''}`,
                user.email || 'N/A',
                user.phone || 'N/A',
                user.organization || 'N/A',
                user.orgType || 'N/A',
                user.education || 'N/A',
                user.homeLocation || 'N/A',
                user.state || 'N/A',
                user.city || 'N/A',
                user.newsletter ? 'Yes' : 'No',
                user.source || 'N/A'
            ];

            cells.forEach(cellText => {
                const td = document.createElement('td');
                td.textContent = cellText;
                td.classList.add('px-4', 'py-3', 'text-gray-700', 'whitespace-nowrap');
                row.appendChild(td);
            });
        });
        allUsersTableContainer.appendChild(table);
    }
});
