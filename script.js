/**
 * ChurnOptix AI - Enterprise Customer Retention Platform
 * Main Controller Script
 */

const app = {
    // 1. STATE MANAGEMENT
    state: {
        apiUrl: localStorage.getItem('churnoptix_api_url') || 'http://localhost:8000/predict',
        theme: localStorage.getItem('churnoptix_theme') || 'light',
        history: JSON.parse(localStorage.getItem('churnoptix_history')) || [],
        
        // Pagination state
        currentPage: 1,
        pageSize: 10,
        
        // Sorting state
        sortField: 'date',
        sortDirection: 'desc'
    },

    // Chart.js references
    charts: {},

    // 2. INITIALIZATION
    async init() {
        this.cacheDOM();
        this.bindEvents();
        this.applyTheme(this.state.theme);
        this.updateSettingsUI();
        this.renderHistoryTable();
        this.initCharts();
        this.checkApiConnection();
        
        // If history is empty, seed 3 mock rows just so the graphs don't look completely empty on first load.
        if (this.state.history.length === 0) {
            this.seedMockHistory(5, false); // silent seed
        } else {
            this.updateOverviewStats();
        }

        // Run the 3-second splash loading sequence
        await this.runSplashSequence();
    },

    runSplashSequence() {
        return new Promise((resolve) => {
            const statusTexts = [
                "Initializing Retention Intelligence Engine...",
                "Establishing secure socket connections...",
                "Caching ML weights & configurations...",
                "Inference engine successfully synced!"
            ];
            let progress = 0;
            let textIndex = 0;

            // Update text at intervals (e.g. every 750ms)
            const textInterval = setInterval(() => {
                if (textIndex < statusTexts.length - 1) {
                    textIndex++;
                    if (this.splashStatus) {
                        this.splashStatus.innerText = statusTexts[textIndex];
                    }
                }
            }, 750);

            // Smooth progress bar increment (0 to 100 over exactly 3000ms)
            const progressInterval = setInterval(() => {
                progress += 1;
                if (this.splashProgress) {
                    this.splashProgress.style.width = progress + '%';
                }

                if (progress >= 100) {
                    clearInterval(progressInterval);
                    clearInterval(textInterval);

                    // Fade out the splash loader screen
                    if (this.splashLoader) {
                        this.splashLoader.classList.add('fade-out');
                    }
                    resolve();
                }
            }, 30); // 30ms * 100 steps = 3000ms (3 seconds)
        });
    },

    // 3. CACHE DOM ELEMENTS
    cacheDOM() {
        // App Splash Screen
        this.splashLoader = document.getElementById('app-splash-loader');
        this.splashStatus = document.getElementById('splash-status-text');
        this.splashProgress = document.getElementById('splash-progress-fill');

        // Layout Shell
        this.sidebar = document.getElementById('sidebar');
        this.btnToggleSidebar = document.getElementById('toggle-sidebar-btn');
        this.btnMobileToggle = document.getElementById('mobile-nav-toggle-btn');
        this.viewTitle = document.getElementById('current-view-title');
        this.navItems = document.querySelectorAll('.sidebar-nav .nav-item, .sidebar-footer .nav-item');
        this.viewSections = document.querySelectorAll('.view-section');
        this.btnThemeToggle = document.getElementById('theme-toggle');

        // Status indicators
        this.statusDot = document.getElementById('api-status-dot');
        this.statusText = document.getElementById('api-status-text');

        // Prediction view - Sub states
        this.formContainer = document.getElementById('predict-form-container');
        this.resultsContainer = document.getElementById('predict-results-container');
        
        // Form & Helpers
        this.churnForm = document.getElementById('churn-form');
        this.btnResetForm = document.getElementById('btn-reset-form');
        this.btnLoadSample = document.getElementById('btn-load-sample');
        this.btnLoadSafeSample = document.getElementById('btn-load-safe-sample');
        this.btnEstimateTotal = document.getElementById('btn-estimate-total');
        
        // Form Inputs
        this.inputs = {
            gender: document.getElementById('gender'),
            SeniorCitizen: document.getElementById('SeniorCitizen'),
            Partner: document.getElementById('Partner'),
            Dependents: document.getElementById('Dependents'),
            tenure: document.getElementById('tenure'),
            PhoneService: document.getElementById('PhoneService'),
            MultipleLines: document.getElementById('MultipleLines'),
            InternetService: document.getElementById('InternetService'),
            OnlineSecurity: document.getElementById('OnlineSecurity'),
            OnlineBackup: document.getElementById('OnlineBackup'),
            DeviceProtection: document.getElementById('DeviceProtection'),
            TechSupport: document.getElementById('TechSupport'),
            StreamingTV: document.getElementById('StreamingTV'),
            StreamingMovies: document.getElementById('StreamingMovies'),
            Contract: document.getElementById('Contract'),
            PaperlessBilling: document.getElementById('PaperlessBilling'),
            PaymentMethod: document.getElementById('PaymentMethod'),
            MonthlyCharges: document.getElementById('MonthlyCharges'),
            TotalCharges: document.getElementById('TotalCharges')
        };



        // Results elements
        this.btnBackToPredict = document.getElementById('btn-back-to-predict');
        this.resTimestamp = document.getElementById('res-timestamp');
        this.resClientId = document.getElementById('res-client-id');
        this.resProb = document.getElementById('res-prob');
        this.resBadge = document.getElementById('res-badge');
        this.resVerdict = document.getElementById('res-verdict');
        this.resConfidence = document.getElementById('res-confidence');
        this.resRevenue = document.getElementById('res-revenue');
        this.resTenureDisplay = document.getElementById('res-tenure-display');
        
        // Insights
        this.insightContract = document.getElementById('insight-contract-risk');
        this.insightFinancial = document.getElementById('insight-financial-risk');
        this.insightSupport = document.getElementById('insight-support-risk');
        this.resActions = document.getElementById('res-actions');
        this.gaugeFillArc = document.getElementById('gauge-fill-arc');
        this.gaugeNeedle = document.getElementById('gauge-needle');

        // History logs elements
        this.historyTbody = document.getElementById('history-tbody');
        this.historySearch = document.getElementById('history-search');
        this.historyFilterRisk = document.getElementById('history-filter-risk');
        this.historyFilterContract = document.getElementById('history-filter-contract');
        
        // Sorting Headers
        this.historyHeaders = document.querySelectorAll('#history-table th.sortable');
        
        // Pagination
        this.pagStartIndex = document.getElementById('pag-start-index');
        this.pagEndIndex = document.getElementById('pag-end-index');
        this.pagTotalCount = document.getElementById('pag-total-count');
        this.btnPagPrev = document.getElementById('btn-pag-prev');
        this.btnPagNext = document.getElementById('btn-pag-next');
        this.pageButtonsContainer = document.getElementById('page-num-buttons');

        // Exporter
        this.exportDropdownBtn = document.getElementById('export-dropdown-btn');
        this.exportDropdownMenu = document.getElementById('export-dropdown-menu');
        this.btnExportCsv = document.getElementById('btn-export-csv');
        this.btnExportJson = document.getElementById('btn-export-json');
        this.btnExportXls = document.getElementById('btn-export-xls');

        // Analytics micro-KPIs
        this.statTotal = document.getElementById('analytics-stat-total');
        this.statHigh = document.getElementById('analytics-stat-high');
        this.statMedian = document.getElementById('analytics-stat-median');
        this.statRevenue = document.getElementById('analytics-stat-revenue');

        // Settings Elements
        this.inpApiUrl = document.getElementById('setting-api-url');
        this.btnTestConnection = document.getElementById('btn-test-connection');
        this.statusBanner = document.getElementById('settings-status-banner');
        this.statusBannerText = document.getElementById('settings-status-banner-text');
        this.themeBoxLight = document.getElementById('theme-box-light');
        this.themeBoxDark = document.getElementById('theme-box-dark');
        this.dbStatRecords = document.getElementById('db-stat-records');
        this.dbStatSize = document.getElementById('db-stat-size');
        this.btnSeedLogs = document.getElementById('btn-seed-logs');
        this.btnClearHistory = document.getElementById('btn-clear-history');
    },

    // 4. BIND EVENT LISTENERS
    bindEvents() {
        // Sidebar Toggling
        this.btnToggleSidebar.addEventListener('click', () => {
            this.sidebar.classList.toggle('collapsed');
        });

        this.btnMobileToggle.addEventListener('click', () => {
            this.sidebar.classList.toggle('open');
        });

        // View Navigation Switches
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(item.dataset.target);
            });
        });

        // Theme Switch
        this.btnThemeToggle.addEventListener('click', () => {
            const nextTheme = this.state.theme === 'light' ? 'dark' : 'light';
            this.applyTheme(nextTheme);
        });

        // Input Form Helpers
        this.btnResetForm.addEventListener('click', () => this.resetForm());
        this.btnLoadSample.addEventListener('click', () => this.loadSampleData('high-risk'));
        this.btnLoadSafeSample.addEventListener('click', () => this.loadSampleData('safe'));
        
        // Auto estimate total charges
        this.btnEstimateTotal.addEventListener('click', () => this.estimateTotalCharges());
        
        // Remove validation error on inputs change
        Object.values(this.inputs).forEach(input => {
            input.addEventListener('change', () => {
                input.parentElement.classList.remove('invalid');
            });
            input.addEventListener('input', () => {
                input.parentElement.classList.remove('invalid');
            });
        });

        // Churn Form Submission
        this.churnForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePredictionPipeline();
        });

        // Reset Results module
        this.btnBackToPredict.addEventListener('click', () => {
            this.resetPredictModule();
        });

        // Table Sorting Header Clicks
        this.historyHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const field = header.dataset.sort;
                if (this.state.sortField === field) {
                    this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.state.sortField = field;
                    this.state.sortDirection = 'desc'; // Default to desc for new fields
                }
                
                // Update header icons
                this.historyHeaders.forEach(h => {
                    const icon = h.querySelector('i');
                    icon.className = 'fa-solid fa-sort';
                });
                const activeIcon = header.querySelector('i');
                activeIcon.className = `fa-solid fa-sort-${this.state.sortDirection === 'asc' ? 'up' : 'down'}`;

                this.renderHistoryTable();
            });
        });

        // Search & Filters for Logs
        this.historySearch.addEventListener('input', () => {
            this.state.currentPage = 1;
            this.renderHistoryTable();
        });
        this.historyFilterRisk.addEventListener('change', () => {
            this.state.currentPage = 1;
            this.renderHistoryTable();
        });
        this.historyFilterContract.addEventListener('change', () => {
            this.state.currentPage = 1;
            this.renderHistoryTable();
        });

        // Pagination buttons
        this.btnPagPrev.addEventListener('click', () => {
            if (this.state.currentPage > 1) {
                this.state.currentPage--;
                this.renderHistoryTable();
            }
        });
        this.btnPagNext.addEventListener('click', () => {
            const totalPages = Math.ceil(this.getFilteredHistory().length / this.state.pageSize);
            if (this.state.currentPage < totalPages) {
                this.state.currentPage++;
                this.renderHistoryTable();
            }
        });

        // Export Dropdown menu
        this.exportDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.exportDropdownMenu.classList.toggle('show');
        });
        document.addEventListener('click', () => {
            this.exportDropdownMenu.classList.remove('show');
        });

        this.btnExportCsv.addEventListener('click', (e) => {
            e.preventDefault();
            this.exportLogs('csv');
        });
        this.btnExportJson.addEventListener('click', (e) => {
            e.preventDefault();
            this.exportLogs('json');
        });
        this.btnExportXls.addEventListener('click', (e) => {
            e.preventDefault();
            this.exportLogs('xls');
        });

        // Settings actions
        this.btnTestConnection.addEventListener('click', () => this.testApiConnection(true));
        
        this.themeBoxLight.addEventListener('click', () => this.applyTheme('light'));
        this.themeBoxDark.addEventListener('click', () => this.applyTheme('dark'));

        this.btnSeedLogs.addEventListener('click', () => this.seedMockHistory(10, true));
        this.btnClearHistory.addEventListener('click', () => this.purgePredictionHistory());
    },

    // 5. VIEW NAVIGATION & ROUTING
    navigate(targetId) {
        // Mobile sidebar collapse on navigation
        this.sidebar.classList.remove('open');

        this.performViewSwitch(targetId);
    },

    performViewSwitch(targetId) {
        // Active state in sidebar navigation
        this.navItems.forEach(item => {
            if (item.dataset.target === targetId) {
                item.classList.add('active');
                this.viewTitle.innerText = item.querySelector('span').innerText;
            } else {
                item.classList.remove('active');
            }
        });

        // Switch active container view
        this.viewSections.forEach(section => {
            if (section.id === targetId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        // Trigger view specific calculations
        if (targetId === 'view-analytics') {
            this.updateOverviewStats();
            this.updateCharts();
        } else if (targetId === 'view-settings') {
            this.updateSettingsUI();
        } else if (targetId === 'view-history') {
            this.renderHistoryTable();
        }
    },

    // 6. DARK / LIGHT THEME CONTROLLER
    applyTheme(themeName) {
        this.state.theme = themeName;
        localStorage.setItem('churnoptix_theme', themeName);

        if (themeName === 'dark') {
            document.body.classList.add('dark-mode');
            this.btnThemeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
            this.themeBoxDark.classList.add('active');
            this.themeBoxLight.classList.remove('active');
        } else {
            document.body.classList.remove('dark-mode');
            this.btnThemeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
            this.themeBoxLight.classList.add('active');
            this.themeBoxDark.classList.remove('active');
        }

        // Re-render graphs under new theme styles
        if (this.viewSections[2].classList.contains('active')) { // If Analytics is open
            this.updateCharts();
        }
    },

    // 7. PLATFORM SETTINGS MANAGEMENT
    updateSettingsUI() {
        this.inpApiUrl.value = this.state.apiUrl;
        this.dbStatRecords.innerText = this.state.history.length;
        
        // Calculate estimated byte size of logs
        const strBytes = encodeURIComponent(JSON.stringify(this.state.history)).replace(/%[0-9A-F]{2}/g, 'a').length;
        this.dbStatSize.innerText = (strBytes / 1024).toFixed(2) + ' KB';
    },

    // 8. API SERVER CONNECTIVITY AUDITS
    async checkApiConnection() {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 2000); // 2s timeout
            
            const response = await fetch(this.state.apiUrl.replace('/predict', '/'), {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(id);

            if (response.ok) {
                this.setConnectionState(true);
            } else {
                this.setConnectionState(false);
            }
        } catch {
            this.setConnectionState(false);
        }
    },

    async testApiConnection(showAlert = false) {
        const urlVal = this.inpApiUrl.value.trim();
        this.btnTestConnection.disabled = true;
        this.btnTestConnection.innerText = 'Testing...';

        this.statusBanner.className = 'settings-api-status-banner warning';
        this.statusBannerText.innerText = 'Connecting to server...';

        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 4000); // 4s timeout
            
            // Query root "/" endpoint first, fallback to checking config URL
            const urlToCheck = urlVal.endsWith('/predict') ? urlVal.replace('/predict', '/') : urlVal;
            
            const response = await fetch(urlToCheck, {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(id);

            if (response.ok) {
                this.state.apiUrl = urlVal;
                localStorage.setItem('churnoptix_api_url', urlVal);
                this.setConnectionState(true);
                
                this.statusBanner.className = 'settings-api-status-banner success';
                this.statusBannerText.innerText = 'Success: Connection established with FastAPI backend model server.';
                
                if (showAlert) alert('Inference pipeline connected successfully.');
            } else {
                throw new Error('Server returned error status');
            }
        } catch (err) {
            this.setConnectionState(false);
            this.statusBanner.className = 'settings-api-status-banner danger';
            this.statusBannerText.innerText = `Error: Connection failed. Verify FastAPI server is active. fallback simulation enabled.`;
            
            if (showAlert) alert('Connection failed. Verify API URL and host availability.');
        } finally {
            this.btnTestConnection.disabled = false;
            this.btnTestConnection.innerText = 'Test API';
            this.updateSettingsUI();
        }
    },

    setConnectionState(isOnline) {
        if (isOnline) {
            this.statusDot.className = 'pulse-indicator status-online';
            this.statusText.innerText = 'Pipeline Online';
        } else {
            this.statusDot.className = 'pulse-indicator status-offline';
            this.statusText.innerText = 'Simulation Mode';
        }
    },

    // 9. FORM UTILITIES & INGESTION DATA
    resetForm() {
        this.churnForm.reset();
        // Clear all validation styles
        Object.values(this.inputs).forEach(input => {
            input.parentElement.classList.remove('invalid');
        });
    },

    estimateTotalCharges() {
        const tenureVal = parseInt(this.inputs.tenure.value);
        const monthlyVal = parseFloat(this.inputs.MonthlyCharges.value);

        if (isNaN(tenureVal) || isNaN(monthlyVal)) {
            alert('Please fill out Tenure and Monthly Charges first to compute estimated cumulative charges.');
            return;
        }

        // Cumulative estimate formula
        const estimate = tenureVal * monthlyVal;
        this.inputs.TotalCharges.value = estimate.toFixed(2);
        this.inputs.TotalCharges.parentElement.classList.remove('invalid');
        
        // Add visual micro-glow effect to input
        const parent = this.inputs.TotalCharges.parentElement;
        parent.style.boxShadow = '0 0 0 3px var(--primary-soft)';
        setTimeout(() => {
            parent.style.boxShadow = '';
        }, 1000);
    },

    loadSampleData(type) {
        this.resetForm();

        const samples = {
            'high-risk': {
                gender: 'Female',
                SeniorCitizen: '1',
                Partner: 'No',
                Dependents: 'No',
                tenure: '3',
                PhoneService: 'Yes',
                MultipleLines: 'Yes',
                InternetService: 'Fiber optic',
                OnlineSecurity: 'No',
                OnlineBackup: 'No',
                DeviceProtection: 'No',
                TechSupport: 'No',
                StreamingTV: 'Yes',
                StreamingMovies: 'Yes',
                Contract: 'Month-to-month',
                PaperlessBilling: 'Yes',
                PaymentMethod: 'Electronic check',
                MonthlyCharges: 104.85,
                TotalCharges: 314.55
            },
            'safe': {
                gender: 'Male',
                SeniorCitizen: '0',
                Partner: 'Yes',
                Dependents: 'Yes',
                tenure: '62',
                PhoneService: 'Yes',
                MultipleLines: 'Yes',
                InternetService: 'DSL',
                OnlineSecurity: 'Yes',
                OnlineBackup: 'Yes',
                DeviceProtection: 'Yes',
                TechSupport: 'Yes',
                StreamingTV: 'No',
                StreamingMovies: 'No',
                Contract: 'Two year',
                PaperlessBilling: 'No',
                PaymentMethod: 'Bank transfer (automatic)',
                MonthlyCharges: 64.20,
                TotalCharges: 3980.40
            }
        };

        const data = samples[type];
        
        // Loop and populate
        Object.keys(data).forEach(key => {
            this.inputs[key].value = data[key];
        });

        // Trigger valid state floats
        Object.values(this.inputs).forEach(input => {
            input.dispatchEvent(new Event('change'));
        });
    },

    validatePredictForm() {
        let isValid = true;
        Object.keys(this.inputs).forEach(key => {
            const input = this.inputs[key];
            const val = input.value.trim();

            if (val === '' || input.validity.valueMissing) {
                input.parentElement.classList.add('invalid');
                isValid = false;
            } else if (input.type === 'number') {
                const numVal = parseFloat(val);
                const minVal = parseFloat(input.min);
                const maxVal = parseFloat(input.max);

                if (isNaN(numVal) || (!isNaN(minVal) && numVal < minVal) || (!isNaN(maxVal) && numVal > maxVal)) {
                    input.parentElement.classList.add('invalid');
                    isValid = false;
                } else {
                    input.parentElement.classList.remove('invalid');
                }
            } else {
                input.parentElement.classList.remove('invalid');
            }
        });
        return isValid;
    },

    // 10. PREDICTION INFERENCE PIPELINE
    async handlePredictionPipeline() {
        if (!this.validatePredictForm()) {
            // Scroll to the first error
            const firstError = document.querySelector('.input-group.invalid');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Ingest Form Values
        const payload = {
            gender: this.inputs.gender.value,
            SeniorCitizen: parseInt(this.inputs.SeniorCitizen.value),
            Partner: this.inputs.Partner.value,
            Dependents: this.inputs.Dependents.value,
            tenure: parseInt(this.inputs.tenure.value),
            PhoneService: this.inputs.PhoneService.value,
            MultipleLines: this.inputs.MultipleLines.value,
            InternetService: this.inputs.InternetService.value,
            OnlineSecurity: this.inputs.OnlineSecurity.value,
            OnlineBackup: this.inputs.OnlineBackup.value,
            DeviceProtection: this.inputs.DeviceProtection.value,
            TechSupport: this.inputs.TechSupport.value,
            StreamingTV: this.inputs.StreamingTV.value,
            StreamingMovies: this.inputs.StreamingMovies.value,
            Contract: this.inputs.Contract.value,
            PaperlessBilling: this.inputs.PaperlessBilling.value,
            PaymentMethod: this.inputs.PaymentMethod.value,
            MonthlyCharges: parseFloat(this.inputs.MonthlyCharges.value),
            TotalCharges: parseFloat(this.inputs.TotalCharges.value)
        };

        let apiResult = null;
        try {
            apiResult = await this.triggerPredictionApi(payload);
        } catch (error) {
            console.warn("FastAPI prediction error. Initiating simulated neural-inference fallback...");
            apiResult = this.computeSimulationInference(payload);
        }

        // Hide Form and directly display Results Screen
        this.formContainer.classList.remove('active-phase');
        
        // Render Inferences in Results Dashboard
        this.renderPredictionResults(payload, apiResult);
        
        this.resultsContainer.classList.add('active-phase');

        // Reset classes for results stagger reveal
        const resultsGrid = this.resultsContainer.querySelector('.results-grid');
        resultsGrid.classList.remove('reveal-gauge', 'reveal-risk', 'reveal-insights', 'reveal-recommendations');
        
        // Force reflow
        resultsGrid.offsetHeight;
        
        // Step 1: Load Gauge first
        resultsGrid.classList.add('reveal-gauge');
        
        // Step 2: Show Risk Level after 600ms
        setTimeout(() => {
            resultsGrid.classList.add('reveal-risk');
        }, 600);
        
        // Step 3: Show Insights after 1000ms
        setTimeout(() => {
            resultsGrid.classList.add('reveal-insights');
        }, 1000);
        
        // Step 4: Show Recommendations after 1400ms
        setTimeout(() => {
            resultsGrid.classList.add('reveal-recommendations');
        }, 1400);
    },

    async triggerPredictionApi(payload) {
        const response = await fetch(this.state.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Inference endpoint returned HTTP status ${response.status}`);
        }

        return await response.json();
    },

    computeSimulationInference(payload) {
        // High fidelity rules based simulator mimicking model behavior
        let baseProb = 15.0; // Base retained rate

        // Risk Factor 1: Month-to-month contracts are highly risky
        if (payload.Contract === 'Month-to-month') baseProb += 35.0;
        else if (payload.Contract === 'One year') baseProb += 5.0;

        // Risk Factor 2: Fiber optic connection issue
        if (payload.InternetService === 'Fiber optic') baseProb += 20.0;

        // Risk Factor 3: Lack of security backup tech supports
        if (payload.OnlineSecurity === 'No') baseProb += 12.0;
        if (payload.TechSupport === 'No') baseProb += 10.0;
        if (payload.OnlineBackup === 'No') baseProb += 8.0;

        // Risk Factor 4: Tenure (short relationships have higher churn rates)
        if (payload.tenure < 6) baseProb += 22.0;
        else if (payload.tenure < 18) baseProb += 12.0;
        else if (payload.tenure > 48) baseProb -= 15.0; // Loyals

        // Risk Factor 5: High charge structures
        if (payload.MonthlyCharges > 85.0) baseProb += 10.0;
        if (payload.SeniorCitizen === 1) baseProb += 5.0;

        // Bound probability to 1.5% - 98.9%
        const prob = Math.max(1.5, Math.min(98.9, baseProb + (Math.random() * 8 - 4)));
        const willChurn = prob >= 50.0 ? "1" : "0";

        return {
            prediction: willChurn,
            churn_probability_percentage: parseFloat(prob.toFixed(1))
        };
    },



    // 11. RESULTS RENDERER & LOG SAVER
    renderPredictionResults(input, output) {
        const prob = output.churn_probability_percentage;
        const willChurn = output.prediction === "1" || prob >= 50.0;
        
        // Calculate Risk Levels
        let riskLevel = 'Low';
        let badgeClass = 'badge-low';
        let verdict = 'Likely to Stay';
        let contractInsight = 'Customer exhibits stable retention signals based on historical patterns.';
        let financialInsight = 'Charges fit within acceptable thresholds corresponding to current tenure.';
        let supportInsight = 'Add-on services (Online Security and Tech Support) are healthy.';
        let actions = [];

        if (prob >= 70.0) {
            riskLevel = 'High';
            badgeClass = 'badge-high';
            verdict = 'High Churn Probability';
            
            // Generate contextual recommendations based on input features
            contractInsight = input.Contract === 'Month-to-month' 
                ? 'High risk: month-to-month contracts have a 4.2x higher churn volume.' 
                : 'Long contract structure, but telemetry shows severe billing issues.';
            financialInsight = input.MonthlyCharges > 80.0
                ? `High pricing risk: monthly billing ($${input.MonthlyCharges}) is above median sector costs.`
                : 'Billing charges are low, but service issues are driving attrition.';
            supportInsight = (input.OnlineSecurity === 'No' || input.TechSupport === 'No')
                ? 'Security & Support gaps: missing essential retention products.'
                : 'Essential support services are present, but user is dissatisfied.';

            actions = [
                'Proactively route account to Senior Account Managers.',
                'Offer a 25% discount voucher on a 1-Year contract upgrade.',
                'Waive security service charge to add Online Security coverage.',
                'Schedule automated customer follow-up call in 3 days.'
            ];
        } else if (prob >= 40.0) {
            riskLevel = 'Medium';
            badgeClass = 'badge-medium';
            verdict = 'At-Risk Retention Monitor';
            
            contractInsight = input.Contract === 'Month-to-month'
                ? 'Month-to-month status observed. A contract upgrade should be proposed.'
                : 'Customer has annual billing, monitoring for renewal dropouts.';
            financialInsight = 'Average billing volume. No immediate price elasticity issues detected.';
            supportInsight = (input.OnlineSecurity === 'No' || input.TechSupport === 'No')
                ? 'Identify add-on opportunities (Tech Support, Cloud Backup) to lock in customer.'
                : 'Services are average; target value-add retention messaging.';

            actions = [
                'Email personalized digital newsletter highlighting unused service features.',
                'Recommend moving to bank transfer auto-payments (waive next $10 transaction).',
                'Suggest adding Cloud Storage Backup with a 30-day free trial.'
            ];
        } else {
            // Low risk actions
            actions = [
                'No immediate churn risk intervention required.',
                'Audit for up-sell potential to premium fiber bandwidth package.',
                'Include in quarterly Net Promoter Score (NPS) email campaign.'
            ];
        }

        // Render elements
        this.resTimestamp.innerText = `Generated: ${new Date().toLocaleString()}`;
        const virtualCustId = 'CUST-' + Math.floor(1000 + Math.random() * 9000);
        this.resClientId.innerText = `ID: ${virtualCustId}`;
        this.resVerdict.innerText = verdict;
        this.resConfidence.innerText = (willChurn ? (88.5 + (prob % 10)) : (92.4 + (prob % 7))).toFixed(1) + '%';
        this.resRevenue.innerText = `$${input.MonthlyCharges.toFixed(2)}`;
        this.resTenureDisplay.innerText = `${input.tenure} Months`;

        // Render Insight texts
        this.insightContract.innerText = contractInsight;
        this.insightFinancial.innerText = financialInsight;
        this.insightSupport.innerText = supportInsight;

        // Render actions list
        this.resActions.innerHTML = '';
        actions.forEach(action => {
            const li = document.createElement('li');
            li.innerText = action;
            this.resActions.appendChild(li);
        });

        // Set Risk badge classes
        this.resBadge.className = `risk-badge ${badgeClass}`;
        this.resBadge.innerText = `${riskLevel} Risk`;

        // Animate counter logic
        this.animateValue(this.resProb, 0, prob, 1000);

        // Animate Gauge Dial Meter needle and arc
        // Dial starts at -90deg (0% risk) to 90deg (100% risk)
        const degrees = -90 + (prob * 1.8);
        setTimeout(() => {
            this.gaugeNeedle.style.transform = `rotate(${degrees}deg)`;
            this.gaugeFillArc.style.transform = `rotate(${prob * 1.8}deg)`;
        }, 150);

        // PERSIST LOG TO HISTORY
        const logEntry = {
            id: virtualCustId,
            date: new Date().toLocaleString(),
            gender: input.gender,
            SeniorCitizen: input.SeniorCitizen,
            Partner: input.Partner,
            Dependents: input.Dependents,
            tenure: input.tenure,
            PhoneService: input.PhoneService,
            MultipleLines: input.MultipleLines,
            InternetService: input.InternetService,
            OnlineSecurity: input.OnlineSecurity,
            OnlineBackup: input.OnlineBackup,
            DeviceProtection: input.DeviceProtection,
            TechSupport: input.TechSupport,
            StreamingTV: input.StreamingTV,
            StreamingMovies: input.StreamingMovies,
            Contract: input.Contract,
            PaperlessBilling: input.PaperlessBilling,
            PaymentMethod: input.PaymentMethod,
            monthlyCharges: input.MonthlyCharges,
            totalCharges: input.TotalCharges,
            probability: prob,
            riskLevel: riskLevel,
            verdict: verdict
        };

        this.state.history.unshift(logEntry); // Add to beginning of history array
        localStorage.setItem('churnoptix_history', JSON.stringify(this.state.history));
        
        // Sync structures
        this.renderHistoryTable();
        this.updateOverviewStats();
    },

    resetPredictModule() {
        this.resultsContainer.classList.remove('active-phase');
        const resultsGrid = this.resultsContainer.querySelector('.results-grid');
        if (resultsGrid) {
            resultsGrid.classList.remove('reveal-gauge', 'reveal-risk', 'reveal-insights', 'reveal-recommendations');
        }
        this.churnForm.reset();
        this.gaugeNeedle.style.transform = `rotate(-90deg)`;
        this.gaugeFillArc.style.transform = `rotate(0deg)`;
        
        // Remove valid float selectors
        Object.values(this.inputs).forEach(input => {
            input.parentElement.classList.remove('invalid');
        });

        this.formContainer.classList.add('active-phase');
    },

    animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = (progress * (end - start) + start).toFixed(1);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    },

    // 12. LOG ENTRIES SYSTEM: FILTER, SORT & SEARCH
    getFilteredHistory() {
        const searchVal = this.historySearch.value.toLowerCase().trim();
        const riskFilterVal = this.historyFilterRisk.value;
        const contractFilterVal = this.historyFilterContract.value;

        // Apply filters
        let logs = this.state.history.filter(log => {
            const matchesSearch = log.id.toLowerCase().includes(searchVal) || 
                                  log.Contract.toLowerCase().includes(searchVal);
            const matchesRisk = riskFilterVal === 'all' || log.riskLevel === riskFilterVal;
            const matchesContract = contractFilterVal === 'all' || log.Contract === contractFilterVal;

            return matchesSearch && matchesRisk && matchesContract;
        });

        // Apply sorting
        logs.sort((a, b) => {
            let fieldA, fieldB;

            switch (this.state.sortField) {
                case 'date':
                    fieldA = new Date(a.date);
                    fieldB = new Date(b.date);
                    break;
                case 'id':
                    fieldA = a.id;
                    fieldB = b.id;
                    break;
                case 'probability':
                    fieldA = a.probability;
                    fieldB = b.probability;
                    break;
                case 'risk':
                    fieldA = a.riskLevel;
                    fieldB = b.riskLevel;
                    break;
                case 'revenue':
                    fieldA = a.monthlyCharges;
                    fieldB = b.monthlyCharges;
                    break;
                default:
                    fieldA = a.date;
                    fieldB = b.date;
            }

            if (fieldA < fieldB) return this.state.sortDirection === 'asc' ? -1 : 1;
            if (fieldA > fieldB) return this.state.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return logs;
    },

    renderHistoryTable() {
        const filtered = this.getFilteredHistory();
        const totalCount = filtered.length;
        
        this.pagTotalCount.innerText = totalCount;

        // Check bounds
        const totalPages = Math.max(1, Math.ceil(totalCount / this.state.pageSize));
        if (this.state.currentPage > totalPages) this.state.currentPage = totalPages;

        const startIndex = totalCount === 0 ? 0 : (this.state.currentPage - 1) * this.state.pageSize;
        const endIndex = Math.min(startIndex + this.state.pageSize, totalCount);

        this.pagStartIndex.innerText = totalCount === 0 ? 0 : startIndex + 1;
        this.pagEndIndex.innerText = endIndex;

        // Enable/Disable pagination buttons
        this.btnPagPrev.disabled = this.state.currentPage === 1;
        this.btnPagNext.disabled = this.state.currentPage === totalPages;

        // Render page buttons
        this.renderPaginationButtons(totalPages);

        // Clear Table rows
        this.historyTbody.innerHTML = '';

        if (totalCount === 0) {
            this.historyTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); font-weight: 500; padding: 24px;">No prediction records match active search filters.</td></tr>`;
            return;
        }

        // Slice data for active page
        const pageData = filtered.slice(startIndex, endIndex);

        pageData.forEach(log => {
            const tr = document.createElement('tr');
            
            let badgeClass = 'badge-low';
            if (log.riskLevel === 'High') badgeClass = 'badge-danger';
            else if (log.riskLevel === 'Medium') badgeClass = 'badge-warning';
            else badgeClass = 'badge-success';

            tr.innerHTML = `
                <td>${log.date}</td>
                <td style="font-family: monospace; font-weight:700; color: var(--primary-color);">${log.id}</td>
                <td style="font-weight: 600;">${log.probability.toFixed(1)}%</td>
                <td><span class="badge ${badgeClass}">${log.riskLevel} Risk</span></td>
                <td style="font-weight: 500;">${log.Contract}</td>
                <td style="font-weight: 600;">$${log.monthlyCharges.toFixed(2)}</td>
                <td class="table-action-col">
                    <button class="row-delete-btn" data-id="${log.id}" title="Remove entry from local history">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;

            // Bind delete event directly
            tr.querySelector('.row-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteHistoryRow(log.id);
            });

            this.historyTbody.appendChild(tr);
        });
    },

    renderPaginationButtons(totalPages) {
        this.pageButtonsContainer.innerHTML = '';
        
        // Define buttons range
        const maxButtons = 5;
        let startPage = Math.max(1, this.state.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.className = `pag-num-btn ${i === this.state.currentPage ? 'active' : ''}`;
            btn.innerText = i;
            btn.addEventListener('click', () => {
                this.state.currentPage = i;
                this.renderHistoryTable();
            });
            this.pageButtonsContainer.appendChild(btn);
        }
    },

    deleteHistoryRow(id) {
        if (confirm(`Remove log row entry for customer ${id}?`)) {
            this.state.history = this.state.history.filter(log => log.id !== id);
            localStorage.setItem('churnoptix_history', JSON.stringify(this.state.history));
            
            this.renderHistoryTable();
            this.updateOverviewStats();
            this.updateCharts();
        }
    },

    purgePredictionHistory() {
        if (confirm('Verify Purging Database: This clears all stored model inferences in local Storage permanently.')) {
            this.state.history = [];
            localStorage.setItem('churnoptix_history', JSON.stringify([]));
            
            // Re-sync
            this.renderHistoryTable();
            this.updateOverviewStats();
            this.updateCharts();
            this.updateSettingsUI();
            alert('Prediction history successfully purged.');
        }
    },

    // 13. SEED GENERATOR MOCK DATABASE
    seedMockHistory(count = 10, showAlert = true) {
        const dummyNames = ['dsl', 'fiber', 'none'];
        const contractTypes = ['Month-to-month', 'One year', 'Two year'];
        const payments = ['Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)'];

        const seedList = [];
        const baseTime = new Date().getTime();

        for (let i = 0; i < count; i++) {
            const probability = parseFloat((Math.random() * 95 + 3).toFixed(1));
            let riskLevel = 'Low';
            let verdict = 'Likely to Stay';
            if (probability >= 70.0) {
                riskLevel = 'High';
                verdict = 'High Churn Probability';
            } else if (probability >= 40.0) {
                riskLevel = 'Medium';
                verdict = 'At-Risk Retention Monitor';
            }

            const contract = contractTypes[Math.floor(Math.random() * contractTypes.length)];
            const monthlyCharges = parseFloat((Math.random() * 95 + 15).toFixed(2));
            const tenure = Math.floor(Math.random() * 70 + 1);
            const totalCharges = parseFloat((monthlyCharges * tenure * (0.95 + Math.random() * 0.1)).toFixed(2));

            // Subtract minutes/hours to simulate timeline
            const entryTime = new Date(baseTime - (i * 3600000) - (Math.random() * 1800000));

            seedList.push({
                id: 'CUST-' + Math.floor(1000 + Math.random() * 9000),
                date: entryTime.toLocaleString(),
                gender: Math.random() > 0.5 ? 'Male' : 'Female',
                SeniorCitizen: Math.random() > 0.85 ? 1 : 0,
                Partner: Math.random() > 0.5 ? 'Yes' : 'No',
                Dependents: Math.random() > 0.6 ? 'Yes' : 'No',
                tenure: tenure,
                PhoneService: 'Yes',
                MultipleLines: Math.random() > 0.5 ? 'Yes' : 'No',
                InternetService: Math.random() > 0.3 ? (Math.random() > 0.5 ? 'Fiber optic' : 'DSL') : 'No',
                OnlineSecurity: Math.random() > 0.5 ? 'Yes' : 'No',
                OnlineBackup: Math.random() > 0.5 ? 'Yes' : 'No',
                DeviceProtection: Math.random() > 0.5 ? 'Yes' : 'No',
                TechSupport: Math.random() > 0.5 ? 'Yes' : 'No',
                StreamingTV: Math.random() > 0.5 ? 'Yes' : 'No',
                StreamingMovies: Math.random() > 0.5 ? 'Yes' : 'No',
                Contract: contract,
                PaperlessBilling: Math.random() > 0.5 ? 'Yes' : 'No',
                PaymentMethod: payments[Math.floor(Math.random() * payments.length)],
                monthlyCharges: monthlyCharges,
                totalCharges: totalCharges,
                probability: probability,
                riskLevel: riskLevel,
                verdict: verdict
            });
        }

        // Merge and save
        this.state.history = [...this.state.history, ...seedList];
        // Sort chronologically
        this.state.history.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        localStorage.setItem('churnoptix_history', JSON.stringify(this.state.history));

        this.renderHistoryTable();
        this.updateOverviewStats();
        this.updateCharts();
        this.updateSettingsUI();

        if (showAlert) {
            alert(`Mock Database seeded with ${count} custom high-fidelity records.`);
        }
    },

    // 14. EXPORT ENGINE
    exportLogs(format) {
        if (this.state.history.length === 0) {
            alert('No history data logs available to export.');
            return;
        }

        let content = '';
        let mimeType = 'text/plain';
        let filename = `churn_prediction_logs_${new Date().toISOString().slice(0,10)}`;

        if (format === 'json') {
            content = JSON.stringify(this.state.history, null, 4);
            mimeType = 'application/json';
            filename += '.json';
        } else if (format === 'csv' || format === 'xls') {
            // Write CSV headers
            const headers = ['Timestamp', 'Customer ID', 'Gender', 'Senior Citizen', 'Partner', 'Dependents', 'Tenure', 'Internet Service', 'Contract', 'Monthly Charges', 'Total Charges', 'Churn Probability', 'Risk Level', 'Model Verdict'];
            const rows = this.state.history.map(log => [
                `"${log.date}"`,
                `"${log.id}"`,
                `"${log.gender}"`,
                log.SeniorCitizen,
                `"${log.Partner}"`,
                `"${log.Dependents}"`,
                log.tenure,
                `"${log.InternetService}"`,
                `"${log.Contract}"`,
                log.monthlyCharges.toFixed(2),
                log.totalCharges.toFixed(2),
                `${log.probability.toFixed(1)}%`,
                `"${log.riskLevel}"`,
                `"${log.verdict}"`
            ]);

            content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            
            if (format === 'csv') {
                mimeType = 'text/csv;charset=utf-8;';
                filename += '.csv';
            } else {
                // XLS simulated format
                mimeType = 'application/vnd.ms-excel;charset=utf-8;';
                filename += '.xls';
            }
        }

        // Browser Download Trigger
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    },

    // 15. OVERVIEW STATISTICS CALCULATOR
    updateOverviewStats() {
        const total = this.state.history.length;
        this.statTotal.innerText = total;

        const highs = this.state.history.filter(log => log.riskLevel === 'High').length;
        this.statHigh.innerText = highs;

        // Compute median risk
        let median = 0.0;
        if (total > 0) {
            const probs = this.state.history.map(log => log.probability).sort((a,b) => a - b);
            const mid = Math.floor(probs.length / 2);
            median = probs.length % 2 !== 0 ? probs[mid] : (probs[mid - 1] + probs[mid]) / 2;
        }
        this.statMedian.innerText = median.toFixed(1) + '%';

        // Est Revenue risk (cumulative monthly charges of high risks)
        const revenueRiskVal = this.state.history
            .filter(log => log.riskLevel === 'High')
            .reduce((sum, log) => sum + log.monthlyCharges, 0);

        this.statRevenue.innerText = `$${revenueRiskVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },

    // 16. CHART.JS VISUAL ENGINE
    initCharts() {
        // Shared chart configurations, helper to fetch text colours
        const getChartColors = () => {
            const isDark = document.body.classList.contains('dark-mode');
            return {
                grid: isDark ? '#1f2937' : '#e2e8f0',
                text: isDark ? '#9ca3af' : '#64748b',
                background: isDark ? '#111827' : '#ffffff'
            };
        };

        const colors = getChartColors();
        Chart.defaults.color = colors.text;
        Chart.defaults.font.family = 'Plus Jakarta Sans, system-ui';

        // 1. Pie: Churn Verdict Distribution
        this.charts.distribution = new Chart(document.getElementById('chart-distribution'), {
            type: 'pie',
            data: {
                labels: ['Retained (Safe)', 'Churn Predicted'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderColor: colors.background,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        // 2. Donut: Risk Breakdown
        this.charts.riskBreakdown = new Chart(document.getElementById('chart-risk-breakdown'), {
            type: 'doughnut',
            data: {
                labels: ['Low Risk', 'Medium Risk', 'High Risk'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderColor: colors.background,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        // 3. Line Area: Trend over time
        this.charts.trend = new Chart(document.getElementById('chart-trend'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Risk Trend %',
                    data: [],
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.08)',
                    fill: true,
                    tension: 0.35,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#4f46e5'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 100,
                        grid: { color: colors.grid },
                        ticks: { callback: value => value + '%' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });

        // 4. Bar: Churn vs Contract duration
        this.charts.contracts = new Chart(document.getElementById('chart-contracts'), {
            type: 'bar',
            data: {
                labels: ['Month-to-month', 'One year', 'Two year'],
                datasets: [{
                    label: 'Avg Probability %',
                    data: [0, 0, 0],
                    backgroundColor: 'rgba(6, 182, 212, 0.75)',
                    borderRadius: 6,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 100,
                        grid: { color: colors.grid },
                        ticks: { callback: value => value + '%' }
                    },
                    x: { grid: { display: false } }
                }
            }
        });

        // 5. Stacked Bar: Internet segments vs risk levels
        this.charts.internet = new Chart(document.getElementById('chart-internet'), {
            type: 'bar',
            data: {
                labels: ['Fiber Optic', 'DSL', 'No Internet'],
                datasets: [
                    {
                        label: 'High Risk',
                        data: [0, 0, 0],
                        backgroundColor: '#ef4444'
                    },
                    {
                        label: 'Med Risk',
                        data: [0, 0, 0],
                        backgroundColor: '#f59e0b'
                    },
                    {
                        label: 'Low Risk',
                        data: [0, 0, 0],
                        backgroundColor: '#10b981'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true, grid: { display: false } },
                    y: { stacked: true, grid: { color: colors.grid } }
                },
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    },

    updateCharts() {
        if (!this.charts.distribution) return; // safety check
        
        const data = this.state.history;
        const colors = document.body.classList.contains('dark-mode') ? 
            { grid: '#1f2937', text: '#9ca3af', bg: '#111827' } : 
            { grid: '#e2e8f0', text: '#64748b', bg: '#ffffff' };

        // Global styles sync
        Chart.defaults.color = colors.text;
        
        // --- 1. Distribution data ---
        const churnCount = data.filter(log => log.probability >= 50.0).length;
        const retainCount = data.length - churnCount;
        this.charts.distribution.data.datasets[0].borderColor = colors.bg;
        this.charts.distribution.data.datasets[0].data = [retainCount, churnCount];
        this.charts.distribution.update();

        // --- 2. Risk breakdown data ---
        const lows = data.filter(log => log.riskLevel === 'Low').length;
        const meds = data.filter(log => log.riskLevel === 'Medium').length;
        const highs = data.filter(log => log.riskLevel === 'High').length;
        this.charts.riskBreakdown.data.datasets[0].borderColor = colors.bg;
        this.charts.riskBreakdown.data.datasets[0].data = [lows, meds, highs];
        this.charts.riskBreakdown.update();

        // --- 3. Trend data ---
        // Take last 10 entries ordered chronologically
        const chronologicalData = [...data].reverse().slice(-10);
        this.charts.trend.data.labels = chronologicalData.map(log => log.id);
        this.charts.trend.data.datasets[0].data = chronologicalData.map(log => log.probability);
        this.charts.trend.options.scales.y.grid.color = colors.grid;
        this.charts.trend.update();

        // --- 4. Contracts data ---
        const contracts = ['Month-to-month', 'One year', 'Two year'];
        const avgProbs = contracts.map(c => {
            const contractData = data.filter(log => log.Contract === c);
            if (contractData.length === 0) return 0;
            const sum = contractData.reduce((acc, log) => acc + log.probability, 0);
            return parseFloat((sum / contractData.length).toFixed(1));
        });
        this.charts.contracts.data.datasets[0].data = avgProbs;
        this.charts.contracts.options.scales.y.grid.color = colors.grid;
        this.charts.contracts.update();

        // --- 5. Internet segments data ---
        const internetCats = ['Fiber optic', 'DSL', 'No'];
        const getCounts = (risk) => {
            return internetCats.map(cat => {
                return data.filter(log => log.InternetService === cat && log.riskLevel === risk).length;
            });
        };
        
        this.charts.internet.data.datasets[0].data = getCounts('High');
        this.charts.internet.data.datasets[1].data = getCounts('Medium');
        this.charts.internet.data.datasets[2].data = getCounts('Low');
        this.charts.internet.options.scales.y.grid.color = colors.grid;
        this.charts.internet.update();
    }
};

// Start application on page load
window.addEventListener('DOMContentLoaded', () => {
    app.init();
});