const { createApp, ref, reactive, computed, onMounted, watch, nextTick } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

// --- API Helper ---
const api = {
    getToken() {
        return localStorage.getItem('jwt_token');
    },
    setToken(token) {
        localStorage.setItem('jwt_token', token);
    },
    clearToken() {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('fullName');
    },
    getFullName() {
        return localStorage.getItem('fullName') || '';
    },
    setFullName(name) {
        localStorage.setItem('fullName', name);
    },
    async request(method, url, body) {
        const headers = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        const opts = { method, headers };
        if (body) {
            opts.body = JSON.stringify(body);
        }
        const res = await fetch(url, opts);
        if (res.status === 401) {
            this.clearToken();
            router.push('/login');
            throw new Error('Unauthorized');
        }
        return res;
    }
};

// --- Login Component ---
const LoginPage = {
    template: `
    <div class="login-bg d-flex align-items-center justify-content-center">
        <div class="card shadow-lg" style="width: 100%; max-width: 420px;">
            <div class="card-body p-4 p-md-5">
                <h2 class="text-center mb-1"><i class="bi bi-car-front-fill text-primary"></i> Car Manager</h2>
                <p class="text-center text-muted mb-4">Sign in to continue</p>
                <div v-if="error" class="alert alert-danger" data-testid="login.form.error">{{ error }}</div>
                <form @submit.prevent="handleLogin" data-testid="login.form">
                    <div class="mb-3">
                        <label for="username" class="form-label">Username</label>
                        <input type="text" class="form-control" id="username" v-model="username" required autofocus
                               placeholder="Enter username" data-testid="login.form.username"/>
                    </div>
                    <div class="mb-3">
                        <label for="password" class="form-label">Password</label>
                        <input type="password" class="form-control" id="password" v-model="password" required
                               placeholder="Enter password" data-testid="login.form.password"/>
                    </div>
                    <button type="submit" class="btn btn-primary w-100 mt-2" :disabled="loading"
                            data-testid="login.form.submit">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                        Login
                    </button>
                </form>
            </div>
        </div>
    </div>
    `,
    setup() {
        const username = ref('');
        const password = ref('');
        const error = ref('');
        const loading = ref(false);

        async function handleLogin() {
            error.value = '';
            loading.value = true;
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username.value, password: password.value })
                });
                const data = await res.json();
                if (res.ok) {
                    api.setToken(data.token);
                    api.setFullName(data.fullName);
                    router.push('/cars');
                } else {
                    error.value = data.error || 'Login failed';
                }
            } catch (e) {
                error.value = 'Network error. Please try again.';
            } finally {
                loading.value = false;
            }
        }

        return { username, password, error, loading, handleLogin };
    }
};

// --- Car List Component ---
const CarListPage = {
    template: `
    <div>
        <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
            <div class="container">
                <a class="navbar-brand" href="#/cars" data-testid="carlist.navbar.brand"><i class="bi bi-car-front-fill"></i> Car Manager</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navContent"
                        data-testid="carlist.navbar.toggler">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navContent">
                    <ul class="navbar-nav ms-auto align-items-lg-center gap-2">
                        <li class="nav-item">
                            <span class="navbar-text text-white-50">Welcome, <span data-testid="carlist.navbar.fullname">{{ fullName }}</span></span>
                        </li>
                        <li class="nav-item">
                            <button @click="handleLogout" class="btn btn-outline-light btn-sm"
                                    data-testid="carlist.navbar.logout">Logout</button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>

        <div class="container">
            <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-3 gap-2">
                <h4 class="mb-0">Car List</h4>
                <router-link to="/cars/add" class="btn btn-success" data-testid="carlist.toolbar.add">
                    <i class="bi bi-plus-lg"></i> Add Car
                </router-link>
            </div>

            <form @submit.prevent="doSearch" class="row g-2 mb-4" data-testid="carlist.search.form">
                <div class="col">
                    <input type="text" class="form-control" v-model="searchQuery"
                           placeholder="Search by name, brand, year, or color..."
                           data-testid="carlist.search.input"/>
                </div>
                <div class="col-auto d-flex gap-2">
                    <button type="submit" class="btn btn-primary" data-testid="carlist.search.submit">
                        <i class="bi bi-search"></i> Search
                    </button>
                    <button type="button" @click="clearSearch" class="btn btn-outline-secondary"
                            data-testid="carlist.search.clear">Clear</button>
                </div>
            </form>

            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
            </div>

            <div v-else-if="cars.length === 0" class="text-center py-5 bg-white rounded shadow-sm">
                <i class="bi bi-inbox display-4 text-muted"></i>
                <p class="text-muted mt-2">No cars found.</p>
            </div>

            <template v-else>
                <!-- Desktop table view -->
                <div class="table-responsive d-none d-md-block">
                    <table class="table table-striped table-hover bg-white shadow-sm rounded overflow-hidden"
                           data-testid="carlist.table">
                        <thead class="table-dark">
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Brand</th>
                            <th>Year</th>
                            <th>Color</th>
                            <th class="text-end">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="(car, index) in cars" :key="car.id">
                            <td>{{ index + 1 }}</td>
                            <td>{{ car.name }}</td>
                            <td>{{ car.brand }}</td>
                            <td>{{ car.year }}</td>
                            <td>{{ car.color }}</td>
                            <td class="text-end">
                                <router-link :to="'/cars/edit/' + car.id" class="btn btn-warning btn-sm"
                                             :data-testid="'carlist.table.edit.' + car.id">
                                    <i class="bi bi-pencil"></i> Edit
                                </router-link>
                                <button @click="deleteCar(car)" class="btn btn-danger btn-sm"
                                        :data-testid="'carlist.table.delete.' + car.id">
                                    <i class="bi bi-trash"></i> Delete
                                </button>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Mobile card view -->
                <div class="d-md-none">
                    <div v-for="car in cars" :key="car.id" class="card mb-3 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">{{ car.name }}</h5>
                            <p class="card-text mb-1"><strong>Brand:</strong> {{ car.brand }}</p>
                            <p class="card-text mb-1"><strong>Year:</strong> {{ car.year }}</p>
                            <p class="card-text mb-3"><strong>Color:</strong> {{ car.color }}</p>
                            <div class="d-flex gap-2">
                                <router-link :to="'/cars/edit/' + car.id" class="btn btn-warning btn-sm"
                                             :data-testid="'carlist.card.edit.' + car.id">
                                    <i class="bi bi-pencil"></i> Edit
                                </router-link>
                                <button @click="deleteCar(car)" class="btn btn-danger btn-sm"
                                        :data-testid="'carlist.card.delete.' + car.id">
                                    <i class="bi bi-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
    `,
    setup() {
        const cars = ref([]);
        const searchQuery = ref('');
        const loading = ref(false);
        const fullName = ref(api.getFullName());

        async function fetchCars(search) {
            loading.value = true;
            try {
                const url = search ? '/api/cars?search=' + encodeURIComponent(search) : '/api/cars';
                const res = await api.request('GET', url);
                if (res.ok) {
                    cars.value = await res.json();
                }
            } catch (e) {
                // handled by api.request
            } finally {
                loading.value = false;
            }
        }

        function doSearch() {
            fetchCars(searchQuery.value);
        }

        function clearSearch() {
            searchQuery.value = '';
            fetchCars('');
        }

        async function deleteCar(car) {
            if (!confirm('Are you sure you want to delete this car?')) return;
            try {
                const res = await api.request('DELETE', '/api/cars/' + car.id);
                if (res.ok) {
                    fetchCars(searchQuery.value);
                }
            } catch (e) {
                // handled by api.request
            }
        }

        function handleLogout() {
            api.clearToken();
            router.push('/login');
        }

        onMounted(() => {
            fetchCars('');
        });

        return { cars, searchQuery, loading, fullName, doSearch, clearSearch, deleteCar, handleLogout };
    }
};

// --- Car Form Component (Add/Edit) ---
const CarFormPage = {
    template: `
    <div>
        <nav class="navbar navbar-dark bg-primary mb-4">
            <div class="container">
                <a class="navbar-brand" href="#/cars" data-testid="carform.navbar.brand"><i class="bi bi-car-front-fill"></i> Car Manager</a>
                <router-link to="/cars" class="btn btn-outline-light btn-sm"
                             data-testid="carform.navbar.back"><i class="bi bi-arrow-left"></i> Back to List</router-link>
            </div>
        </nav>

        <div class="container">
            <div class="row justify-content-center">
                <div class="col-12 col-md-8 col-lg-6">
                    <div class="card shadow-sm">
                        <div class="card-header bg-white">
                            <h5 class="mb-0">{{ isEdit ? 'Edit' : 'Add' }} Car</h5>
                        </div>
                        <div class="card-body">
                            <div v-if="loadingCar" class="text-center py-4">
                                <div class="spinner-border text-primary" role="status"></div>
                            </div>
                            <form v-else @submit.prevent="handleSubmit" data-testid="carform.form">
                                <div class="mb-3">
                                    <label for="name" class="form-label">Car Name</label>
                                    <input type="text" class="form-control" id="name" v-model="car.name" required
                                           placeholder="e.g. Camry" data-testid="carform.form.name"/>
                                </div>
                                <div class="mb-3">
                                    <label for="brand" class="form-label">Brand</label>
                                    <input type="text" class="form-control" id="brand" v-model="car.brand" required
                                           placeholder="e.g. Toyota" data-testid="carform.form.brand"/>
                                </div>
                                <div class="mb-3">
                                    <label for="year" class="form-label">Year</label>
                                    <input type="number" class="form-control" id="year" v-model.number="car.year" required
                                           min="1900" max="2030" placeholder="e.g. 2024" data-testid="carform.form.year"/>
                                </div>
                                <div class="mb-3">
                                    <label for="color" class="form-label">Color</label>
                                    <input type="text" class="form-control" id="color" v-model="car.color" required
                                           placeholder="e.g. White" data-testid="carform.form.color"/>
                                </div>
                                <div v-if="error" class="alert alert-danger" data-testid="carform.form.error">{{ error }}</div>
                                <div class="d-flex gap-2">
                                    <button type="submit" class="btn btn-primary" :disabled="saving"
                                            data-testid="carform.form.submit">
                                        <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                                        {{ isEdit ? 'Edit' : 'Add' }} Car
                                    </button>
                                    <router-link to="/cars" class="btn btn-outline-secondary"
                                                 data-testid="carform.form.cancel">Cancel</router-link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    setup() {
        const route = VueRouter.useRoute();
        const car = reactive({ name: '', brand: '', year: 2024, color: '' });
        const isEdit = computed(() => !!route.params.id);
        const saving = ref(false);
        const loadingCar = ref(false);
        const error = ref('');

        async function loadCar() {
            if (!route.params.id) return;
            loadingCar.value = true;
            try {
                const res = await api.request('GET', '/api/cars/' + route.params.id);
                if (res.ok) {
                    const data = await res.json();
                    car.name = data.name;
                    car.brand = data.brand;
                    car.year = data.year;
                    car.color = data.color;
                } else {
                    router.push('/cars');
                }
            } catch (e) {
                // handled by api.request
            } finally {
                loadingCar.value = false;
            }
        }

        async function handleSubmit() {
            saving.value = true;
            error.value = '';
            try {
                const method = isEdit.value ? 'PUT' : 'POST';
                const url = isEdit.value ? '/api/cars/' + route.params.id : '/api/cars';
                const res = await api.request(method, url, {
                    name: car.name,
                    brand: car.brand,
                    year: car.year,
                    color: car.color
                });
                if (res.ok) {
                    router.push('/cars');
                } else {
                    const data = await res.json();
                    error.value = data.error || 'Failed to save car';
                }
            } catch (e) {
                error.value = 'Network error. Please try again.';
            } finally {
                saving.value = false;
            }
        }

        onMounted(() => {
            loadCar();
        });

        return { car, isEdit, saving, loadingCar, error, handleSubmit };
    }
};

// --- Router ---
const routes = [
    { path: '/', redirect: '/cars' },
    { path: '/login', component: LoginPage },
    { path: '/cars', component: CarListPage },
    { path: '/cars/add', component: CarFormPage },
    { path: '/cars/edit/:id', component: CarFormPage }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

// Navigation guard: redirect to login if no token
router.beforeEach((to, from) => {
    const token = api.getToken();
    if (to.path !== '/login' && !token) {
        return '/login';
    }
    if (to.path === '/login' && token) {
        return '/cars';
    }
});

// --- App ---
const app = createApp({
    template: '<router-view></router-view>'
});
app.use(router);
app.mount('#app');
