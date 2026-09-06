/* ================================
   GLOBAL VARIABLES
================================ */

let allData = [];
let filteredData = [];

let salesTrendChart;
let paymentChart;
let statusChart;
let productChart;

/* ================================
   DOM ELEMENTS
================================ */

const themeToggle = document.getElementById("themeToggle");

const paymentFilter = document.getElementById("paymentFilter");
const statusFilter = document.getElementById("statusFilter");
const resetBtn = document.getElementById("resetBtn");

const totalOrdersElement = document.getElementById("totalOrders");
const totalSalesElement = document.getElementById("totalSales");
const averageOrderValueElement = document.getElementById("averageOrderValue");
const averageCartItemsElement = document.getElementById("averageCartItems");

/* ================================
   LIGHT AND DARK THEME
================================ */

function applyTheme(theme) {
    if (theme === "dark") {
        document.body.classList.add("dark-mode");

        if (themeToggle) {
            themeToggle.textContent = "☀️ Light Mode";
        }
    } else {
        document.body.classList.remove("dark-mode");

        if (themeToggle) {
            themeToggle.textContent = "🌙 Dark Mode";
        }
    }

    updateCharts();
}

if (themeToggle) {
    themeToggle.addEventListener("click", function () {
        const isDarkMode = document.body.classList.contains("dark-mode");

        if (isDarkMode) {
            localStorage.setItem("theme", "light");
            applyTheme("light");
        } else {
            localStorage.setItem("theme", "dark");
            applyTheme("dark");
        }
    });
}

/* Load saved theme */
const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

/* ================================
   LOAD CSV DATA
================================ */

Papa.parse("Final_EDA_Dataset.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,

    complete: function (results) {
        allData = results.data;

        filteredData = [...allData];

        populateFilters();
        updateDashboard();
    },

    error: function (error) {
        console.error("Error loading CSV:", error);
        alert("Unable to load Final_EDA_Dataset.csv");
    }
});

/* ================================
   POPULATE FILTERS
================================ */

function populateFilters() {
    const paymentMethods = [
        ...new Set(
            allData
                .map(row => row.PaymentMethod)
                .filter(value => value && value.trim() !== "")
        )
    ];

    const orderStatuses = [
        ...new Set(
            allData
                .map(row => row.OrderStatus)
                .filter(value => value && value.trim() !== "")
        )
    ];

    if (paymentFilter) {
        paymentMethods.forEach(method => {
            const option = document.createElement("option");
            option.value = method;
            option.textContent = method;
            paymentFilter.appendChild(option);
        });
    }

    if (statusFilter) {
        orderStatuses.forEach(status => {
            const option = document.createElement("option");
            option.value = status;
            option.textContent = status;
            statusFilter.appendChild(option);
        });
    }
}

/* ================================
   FILTER DATA
================================ */

function filterData() {
    const selectedPayment = paymentFilter
        ? paymentFilter.value
        : "";

    const selectedStatus = statusFilter
        ? statusFilter.value
        : "";

    filteredData = allData.filter(row => {
        const paymentMatch =
            selectedPayment === "" ||
            row.PaymentMethod === selectedPayment;

        const statusMatch =
            selectedStatus === "" ||
            row.OrderStatus === selectedStatus;

        return paymentMatch && statusMatch;
    });

    updateDashboard();
}

/* ================================
   RESET FILTERS
================================ */

if (paymentFilter) {
    paymentFilter.addEventListener("change", filterData);
}

if (statusFilter) {
    statusFilter.addEventListener("change", filterData);
}

if (resetBtn) {
    resetBtn.addEventListener("click", function () {
        paymentFilter.value = "";
        statusFilter.value = "";

        filteredData = [...allData];

        updateDashboard();
    });
}

/* ================================
   UPDATE DASHBOARD
================================ */

function updateDashboard() {
    updateCards();
    updateCharts();
}

/* ================================
   UPDATE KPI CARDS
================================ */

function updateCards() {
    const totalOrders = filteredData.length;

    const totalSales = filteredData.reduce((sum, row) => {
        return sum + Number(row.TotalPrice || 0);
    }, 0);

    const averageOrderValue =
        totalOrders > 0
            ? totalSales / totalOrders
            : 0;

    const totalCartItems = filteredData.reduce((sum, row) => {
        return sum + Number(row.ItemsInCart || 0);
    }, 0);

    const averageCartItems =
        totalOrders > 0
            ? totalCartItems / totalOrders
            : 0;

    if (totalOrdersElement) {
        totalOrdersElement.textContent =
            totalOrders.toLocaleString();
    }

    if (totalSalesElement) {
        totalSalesElement.textContent =
            "₹" + totalSales.toLocaleString(undefined, {
                maximumFractionDigits: 2
            });
    }

    if (averageOrderValueElement) {
        averageOrderValueElement.textContent =
            "₹" + averageOrderValue.toLocaleString(undefined, {
                maximumFractionDigits: 2
            });
    }

    if (averageCartItemsElement) {
        averageCartItemsElement.textContent =
            averageCartItems.toLocaleString(undefined, {
                maximumFractionDigits: 2
            });
    }
}

/* ================================
   CHART THEME COLORS
================================ */

function getChartColors() {
    const isDarkMode =
        document.body.classList.contains("dark-mode");

    return {
        text: isDarkMode ? "#f8fafc" : "#1e293b",
        grid: isDarkMode ? "#475569" : "#e2e8f0",
        primary: isDarkMode ? "#818cf8" : "#6366f1",
        secondary: isDarkMode ? "#38bdf8" : "#0ea5e9",
        success: isDarkMode ? "#4ade80" : "#16a34a",
        warning: isDarkMode ? "#facc15" : "#ca8a04",
        danger: isDarkMode ? "#fb7185" : "#e11d48"
    };
}

/* ================================
   UPDATE ALL CHARTS
================================ */

function updateCharts() {
    if (!filteredData || filteredData.length === 0) {
        return;
    }

    createSalesTrendChart();
    createPaymentChart();
    createStatusChart();
    createProductChart();
}

/* ================================
   COMMON CHART OPTIONS
================================ */

function getCommonChartOptions() {
    const colors = getChartColors();

    return {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            legend: {
                labels: {
                    color: colors.text
                }
            }
        },

        scales: {
            x: {
                ticks: {
                    color: colors.text
                },
                grid: {
                    color: colors.grid
                }
            },

            y: {
                ticks: {
                    color: colors.text
                },
                grid: {
                    color: colors.grid
                }
            }
        }
    };
}

/* ================================
   SALES TREND CHART
================================ */

function createSalesTrendChart() {
    const canvas = document.getElementById("salesTrendChart");

    if (!canvas) return;

    const salesByDate = {};

    filteredData.forEach(row => {
        const date = row.Date || "Unknown";

        if (!salesByDate[date]) {
            salesByDate[date] = 0;
        }

        salesByDate[date] += Number(row.TotalPrice || 0);
    });

    const labels = Object.keys(salesByDate).sort();

    const values = labels.map(date => salesByDate[date]);

    if (salesTrendChart) {
        salesTrendChart.destroy();
    }

    const colors = getChartColors();

    salesTrendChart = new Chart(canvas, {
        type: "line",

        data: {
            labels: labels,
            datasets: [
                {
                    label: "Sales",
                    data: values,
                    borderColor: colors.primary,
                    backgroundColor: "rgba(99, 102, 241, 0.15)",
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3
                }
            ]
        },

        options: getCommonChartOptions()
    });
}

/* ================================
   PAYMENT METHOD CHART
================================ */

function createPaymentChart() {
    const canvas = document.getElementById("paymentChart");

    if (!canvas) return;

    const paymentCounts = {};

    filteredData.forEach(row => {
        const method = row.PaymentMethod || "Unknown";

        paymentCounts[method] =
            (paymentCounts[method] || 0) + 1;
    });

    const labels = Object.keys(paymentCounts);
    const values = Object.values(paymentCounts);

    if (paymentChart) {
        paymentChart.destroy();
    }

    paymentChart = new Chart(canvas, {
        type: "doughnut",

        data: {
            labels: labels,
            datasets: [
                {
                    data: values,
                    backgroundColor: [
                        "#6366f1",
                        "#0ea5e9",
                        "#22c55e",
                        "#f59e0b",
                        "#ef4444",
                        "#a855f7"
                    ],
                    borderWidth: 2
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: getChartColors().text
                    }
                }
            }
        }
    });
}

/* ================================
   ORDER STATUS CHART
================================ */

function createStatusChart() {
    const canvas = document.getElementById("statusChart");

    if (!canvas) return;

    const statusCounts = {};

    filteredData.forEach(row => {
        const status = row.OrderStatus || "Unknown";

        statusCounts[status] =
            (statusCounts[status] || 0) + 1;
    });

    const labels = Object.keys(statusCounts);
    const values = Object.values(statusCounts);

    if (statusChart) {
        statusChart.destroy();
    }

    const colors = getChartColors();

    statusChart = new Chart(canvas, {
        type: "bar",

        data: {
            labels: labels,
            datasets: [
                {
                    label: "Orders",
                    data: values,
                    backgroundColor: colors.secondary,
                    borderRadius: 8
                }
            ]
        },

        options: getCommonChartOptions()
    });
}

/* ================================
   TOP 10 PRODUCTS CHART
================================ */

function createProductChart() {
    const canvas = document.getElementById("productChart");

    if (!canvas) return;

    const productSales = {};

    filteredData.forEach(row => {
        const product = row.Product || "Unknown";

        productSales[product] =
            (productSales[product] || 0) +
            Number(row.TotalPrice || 0);
    });

    const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const labels = topProducts.map(item => item[0]);
    const values = topProducts.map(item => item[1]);

    if (productChart) {
        productChart.destroy();
    }

    const colors = getChartColors();

    productChart = new Chart(canvas, {
        type: "bar",

        data: {
            labels: labels,
            datasets: [
                {
                    label: "Sales",
                    data: values,
                    backgroundColor: colors.primary,
                    borderRadius: 8
                }
            ]
        },

        options: {
            ...getCommonChartOptions(),

            indexAxis: "y"
        }
    });
}