<script lang="ts">
// @ts-nocheck
    import { Pages, type Driver, type Passenger } from "../../ts/types";
    import Map from "../../components/Map.svelte";
    import Navbar from "../../components/Navbar.svelte"
    import { onMount } from "svelte";
//	import { GET } from "../api/driver/getAllDrivers/+server";

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // JavaScript numeruje miesiące od 0, dlatego dodajemy 1
    const year = today.getFullYear();

    const formattedDate = today.toISOString();

    let mapfetch = false;
    let map2fetch = false;
    let statefetch = false;

    let mapRef = null;
    let mapRefTrip = null;
    let mapRefPrimary = null;
    let tripBtnState = false;
    let inputValue = ''
    let driverName = ''
    let currentDest = 'Prząśniczki 2'
    let destCity = ', Lublin'
    let clicked = false;
    let destValue = '';
    let destRef = null;
    let stars = [0, 0, 0, 0, 0]

    let loading: boolean = true
    let user: Passenger | Driver = null;
    let trip = null;
    let state = 1;
    let pricePerMeter
    let priceStart
    let priceKm
    let calculatedPrice
    function calculatePrice(distance) {
        calculatedPrice = distance * pricePerMeter + priceStart
        if (distance >= 1000) {
            let km = distance / 1000
            let additionalCost = Math.floor(km) * priceKm
            calculatedPrice += additionalCost;
        }
        console.log(pricePerMeter)
        console.log(priceStart)
        console.log(distance)
        console.log(calculatedPrice)
    }
    export async function getPricePerMeter() {
        const response = await fetch("/api/settings/pricePerMeter/read",
            {
                method: 'GET'
            }
        )
        if (response.ok) {
            let data = await response.json()
            pricePerMeter = data.value
        }
    }
    export async function getPriceStart() {
        const response = await fetch("/api/settings/priceStart/read",
            {
                method: 'GET'
            }
        )
        if (response.ok) {
            let data = await response.json()
            priceStart = data.value
        }
    }
    export async function getPriceKm() {
        const response = await fetch("/api/settings/priceKm/read",
            {
                method: 'GET'
            }
        )
        if (response.ok) {
            let data = await response.json()
            priceKm = data.value
        }
    }
    async function getAuthToken() {
        const authToken = localStorage.getItem("authToken");
        if (authToken) {
            const response = await fetch('/api/decodeToken', {
            method: 'POST',
            body: JSON.stringify(authToken)
            });
            if (response.ok) {
                //token was decoded
                const tokenData = await response.json()
                const res = await fetch("/api/passenger", {
                    method: 'POST',
                    body: JSON.stringify(tokenData)
                })
                if (res.ok) {
                    user = await res.json()
                    console.log(user)
                    if (user.onGoing != 0) {
                        const response = await fetch('/api/trip', {
                        method: 'POST',
                        body: JSON.stringify({id: user.onGoing})
                    })
                    if (response.ok) {
                        trip = await response.json()
                        state = trip.state
                        const res = await fetch('/api/driver', {
                            method: 'POST',
                            body: JSON.stringify({id: trip.driverId})
                        })
                        if (res.ok) {
                            let driver = await res.json();
                            driverName = driver.login;
                        }
                    }
                    }
                }
                else {
                    
                    //user not found in db...
                }
            }
            else {
                //token was not decoded
            }
        }
        else {
            //authToken was not found in localStorage
        }
    }
    onMount(async () => {
        await getAuthToken();
        await getPricePerMeter();
        await getPriceStart();
        await getPriceKm();
        loading = false;
    });
    $: if (state === 3 && !statefetch) {
        async function func() {
            const response = await fetch('/api/trip', {
                method: 'POST',
                body: JSON.stringify({id: user.onGoing})
            })
            if (response.ok) {
                trip = await response.json()
                const res = await fetch('/api/driver', {
                    method: 'POST',
                    body: JSON.stringify({id: trip.driverId})
                })
                if (res.ok) {
                    let driver = await res.json();
                    driverName = driver.login;
                }
            }
        }
        func();
        statefetch = true
    }
    $: if (mapRef && !map2fetch) {
        const func = async() => {
            if (state === 3 && trip) {
                await mapRef.setMapViewFromStreetName(trip.startAddress, trip.destination, true)
            }
            else {
                await mapRef.setMapViewFromStreetName(currentDest + destCity, inputValue + destCity, false)
            }
            //await mapRef.setMapViewFromStreetName("Prząśniczki 2, Lublin", "Kiepury 3, Lublin")            //  mapRef.calculateDistance();
        }
        func();
        map2fetch = true
    }
    $: if (mapRefPrimary && !mapfetch) {
        const func = async() => {
            await mapRefPrimary.setMapMarker(currentDest + destCity)
        }
        
        func();
        mapfetch = true
    }
    $: if (destRef) {
        destRef.focus();
    }
    async function handleCreateTrip() {
        tripBtnState = false;
        const response = await fetch('/api/trip/create', {
            method: 'POST',
            body: JSON.stringify({rating: 0, startAddress: currentDest + destCity, destination: inputValue + destCity, passengerId: user.id, driverId: 1, price: calculatedPrice, state: 3, date: formattedDate})
        })
        if (response.ok) {
            const tripData = await response.json()
            trip = tripData
            const res = await fetch('/api/passenger/updateOngoing', {
                method: 'POST',
                body: JSON.stringify({email: user.email, onGoing: tripData.id})
            })
            if (res.ok) {
                statefetch = true;
                state = 3
                map2fetch = false;
            }
        }
    }
    async function handleTripState(stateValue) {
        const response = await fetch('api/trip/updateState', {
            method: 'POST',
            body: JSON.stringify({id: trip.id, state: stateValue})
        })
        if (response.ok) {
            trip = await response.json()
            state = stateValue
        }
    }
    async function handleInput(event) {
        if (event.key === 'Enter') {
            const trimmedValue = inputValue.trim();
            if (trimmedValue !== '') {
                state = 2;
            }
        }
    }
    async function handleDestInput(event) {
        if (event.key === 'Enter') {
            const trimmedValue = destValue.trim();
            if (trimmedValue !== '') {
                currentDest = destValue
                await mapRefPrimary.setMapMarker(currentDest + destCity)
            }
            clicked = !clicked
        }
    }
    function handleDestBlurInput() {
        const trimmedValue = destValue.trim();
        if (trimmedValue !== '') {
            currentDest = destValue
        }
        clicked = !clicked
    }
    function handleStarHover(star){
        if (star === 4) {
            stars[4] = 1
            stars[3] = 1
            stars[2] = 1
            stars[1] = 1
            stars[0] = 1
        }
        else if (star === 3) {
            stars[3] = 1
            stars[2] = 1
            stars[1] = 1
            stars[0] = 1
        }
        else if (star === 2) {
            stars[2] = 1
            stars[1] = 1
            stars[0] = 1
        }
        else if (star === 1) {
            stars[0] = 1
            stars[1] = 1
        }
        else if (star === 0) {
            stars[0] = 1
        }
    }
    function handleBlurStar(star) {
        if (star === 4) {
            stars[4] = 0
            stars[3] = 0
            stars[2] = 0
            stars[1] = 0
            stars[0] = 0
        }
        else if (star === 3) {
            stars[3] = 0
            stars[2] = 0
            stars[1] = 0
            stars[0] = 0
        }
        else if (star === 2) {
            stars[2] = 0
            stars[1] = 0
            stars[0] = 0
        }
        else if (star === 1) {
            stars[0] = 0
            stars[1] = 0
        }
        else if (star === 0) {
            stars[0] = 0
        }
    }
    async function handleTripGrade(grade) {
        const response = await fetch('api/trip/updateGrade', {
            method: 'POST',
            body: JSON.stringify({id: trip.id, rating: grade})
        })
        if (response.ok) {
            const res = await fetch('api/passenger/updateOngoing', {
                method: 'POST',
                body: JSON.stringify({email: user.email, onGoing: 0})
            })
            if (res.ok) {
                user = await res.json();
                trip = {}
                state = 1;
            }
        }
    }
</script>
<style>
    input {
        background-color: rgb(61, 61, 61);
        color: rgb(190, 190, 190);
        font-family: 'Plus Jakarta Sans', 'sans-serif';
        font-size: 20px;
        font-weight: 600;
        padding-left: 8px;
    }
    input:focus {
        box-shadow: none;
        outline: none;     
    }
    input::placeholder {
        color: rgb(190, 190, 190);
        font-family: 'Plus Jakarta Sans', 'sans-serif';
        font-size: 20px;
        font-weight: 600;
    }
    .black-label {
        color: rgb(0, 0, 0);
        font-size: 24px;
        font-weight: 700;
    }
    .red {
        color: rgb(255, 65, 65)
    }
</style>

{#if !loading}
    {#if user}
    {#if state === 1}
        <div class="flex flex-col w-screen h-screen pt-5 bg-neutral-950">
            <div class="flex flex-col items-center">
                <div class="flex flex-row items-center gap-4 mx-6">  
                    <div class="flex items-center justify-center w-16 h-16 mt-5 bg-yellow-app rounded-full">
                        <svg width="64.000000" height="64.000000" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                            <desc>
                                    Created with Pixso.
                            </desc>
                            <defs/>
                            <mask id="mask59_5869" mask-type="alpha" maskUnits="userSpaceOnUse" x="0.000000" y="0.000000" width="220.000000" height="220.000000">
                                <circle id="Ellipse 2" cx="110.000000" cy="110.000000" r="110.000000" fill="#E65C5C" fill-opacity="1.000000"/>
                            </mask>
                            <g mask="url(#mask59_5869)">
                                <path id="Vector" d="M128.82 200.68C140.61 205.07 150.47 213.42 156.79 224.1L62.74 224.1C69.06 213.41 78.92 205.07 90.71 200.68L128.82 200.68Z" fill="#61A2F9" fill-opacity="1.000000" fill-rule="nonzero"/>
                                <path id="Vector" d="M101.44 200.68C96.29 205.07 91.98 213.41 89.22 224.1L62.74 224.1C69.06 213.41 78.92 205.07 90.71 200.68L101.44 200.68Z" fill="#5490F9" fill-opacity="1.000000" fill-rule="nonzero"/>
                                <path id="Vector" d="M128.82 200.67L109.77 224.1L96.03 207.21L90.71 200.67C93.18 199.75 95.71 199.02 98.28 198.47L98.28 178.56L121.25 178.56L121.25 198.47C123.83 199.02 126.36 199.75 128.82 200.67Z" fill="#FFDDCE" fill-opacity="1.000000" fill-rule="nonzero"/>
                                <path id="Vector" d="M98.28 178.56L98.28 198.47C95.71 199.02 93.18 199.75 90.71 200.67L96.03 207.21C100.68 202.57 106.55 203.43 106.55 203.43L106.55 187.6L113.2 187.6C115.95 187.6 118.65 187.32 121.25 186.8L121.25 178.56L98.28 178.56Z" fill="#FFCBBE" fill-opacity="1.000000" fill-rule="nonzero"/>
                                <path id="Vector" d="M157.33 67.67L134.38 44.72C128.84 39.19 119.87 39.19 114.33 44.72C111.84 47.21 110.48 50.4 110.23 53.65L101.3 44.72C95.76 39.19 86.79 39.19 81.25 44.72C78.76 47.21 77.39 50.4 77.14 53.65L68.21 44.72C62.68 39.19 53.7 39.19 48.17 44.72C42.63 50.26 42.63 59.23 48.17 64.77C50.7 67.3 52.71 70.31 54.08 73.62C55.45 76.92 56.15 80.47 56.15 84.05L56.15 135.29L163.37 135.29L163.37 83.64C163.72 77.91 161.71 72.05 157.33 67.67Z" fill="#365E7D" fill-opacity="1.000000" fill-rule="nonzero"/>
                                <path id="Vector" d="M99.84 84.05L99.84 135.29L56.15 135.29L56.15 84.05C56.15 80.44 55.43 76.9 54.08 73.62C52.7 70.31 50.69 67.3 48.16 64.77C45.39 62 44.01 58.37 44.01 54.75C44.01 51.12 45.39 47.49 48.16 44.72C53.7 39.19 62.67 39.19 68.21 44.72L77.14 53.66C77.27 52.01 77.68 50.4 78.35 48.9C79.06 47.35 80.04 45.93 81.24 44.72C85.39 40.58 91.46 39.54 96.57 41.6C94.81 42.31 93.2 43.37 91.86 44.72C89.09 47.49 87.7 51.12 87.7 54.75C87.7 58.37 89.09 62 91.86 64.77C94.39 67.3 96.4 70.31 97.77 73.62C99.14 76.93 99.84 80.47 99.84 84.05Z" fill="#2B4D66" fill-opacity="1.000000" fill-rule="nonzero"/>
                                <path id="Vector" d="M73.42 137.95C73.42 146.07 66.84 152.65 58.72 152.65C50.6 152.65 44.01 146.07 44.01 137.95C44.01 129.82 50.6 123.24 58.72 123.24C66.84 123.24 73.42 129.82 73.42 137.95Z" fill="#FFCBBE" fill-opacity="1.000000" fill-rule="evenodd"/>
                                <path id="Vector" d="M175.51 137.95C175.51 146.07 168.93 152.65 160.81 152.65C152.69 152.65 146.11 146.07 146.11 137.95C146.11 129.83 152.69 123.24 160.81 123.24C168.93 123.24 175.51 129.83 175.51 137.95Z" fill="#FFCBBE" fill-opacity="1.000000" fill-rule="evenodd"/>
                                <path id="Vector" d="M126.72 80.12L92.82 80.12C78.05 80.12 66.09 92.09 66.09 106.85L66.09 139.12C66.09 161.35 84.11 179.38 106.34 179.38L113.2 179.38C135.43 179.38 153.45 161.35 153.45 139.12L153.45 106.85C153.45 92.09 141.48 80.12 126.72 80.12Z" fill="#FFDDCE" fill-opacity="1.000000" fill-rule="nonzero"/>
                                <path id="Vector" d="M121.45 178.53C118.74 179.09 115.97 179.37 113.2 179.37L106.34 179.37C84.11 179.37 66.09 161.35 66.09 139.12L66.09 106.85C66.09 92.08 78.06 80.12 92.82 80.12L116.19 80.12C101.42 80.12 89.46 92.08 89.46 106.85L89.46 139.12C89.46 158.52 103.18 174.72 121.45 178.53Z" fill="#FFCBBE" fill-opacity="1.000000" fill-rule="nonzero"/>
                                <path id="Vector" d="M166.14 121.31L166.14 83.72C166.33 80.41 165.82 77.09 164.64 73.98C163.46 70.88 161.64 68.06 159.29 65.71L157.05 63.47C156.53 62.96 155.83 62.67 155.1 62.67C154.36 62.67 153.66 62.96 153.14 63.48C152.63 64 152.33 64.7 152.33 65.43C152.33 66.17 152.62 66.87 153.14 67.39L155.37 69.62C157.17 71.43 158.57 73.6 159.48 75.98C160.38 78.37 160.76 80.92 160.61 83.47C160.6 83.53 160.6 83.58 160.6 83.64L160.6 120.48C159.12 120.5 157.64 120.7 156.21 121.09L156.21 106.85C156.21 90.58 142.98 77.35 126.72 77.35L92.81 77.35C81.75 77.35 71.71 83.46 66.62 93.28C66.28 93.93 66.22 94.69 66.44 95.39C66.66 96.09 67.15 96.67 67.8 97C68.46 97.34 69.21 97.41 69.91 97.19C70.61 96.97 71.19 96.48 71.53 95.83C75.67 87.85 83.82 82.89 92.81 82.89L126.72 82.89C139.92 82.89 150.67 93.64 150.67 106.85L150.67 139.13C150.67 159.79 133.86 176.61 113.19 176.61L106.33 176.61C85.67 176.61 68.85 159.79 68.85 139.13L68.85 106.85C68.85 106.37 68.87 105.86 68.9 105.35C68.92 104.99 68.88 104.62 68.76 104.28C68.64 103.93 68.46 103.61 68.21 103.34C67.97 103.07 67.68 102.84 67.35 102.68C67.02 102.52 66.67 102.43 66.3 102.4C65.94 102.38 65.57 102.43 65.23 102.55C64.88 102.67 64.57 102.86 64.29 103.1C64.02 103.34 63.8 103.64 63.64 103.97C63.48 104.3 63.39 104.65 63.37 105.02C63.33 105.63 63.31 106.24 63.31 106.85L63.31 121.09C61.88 120.7 60.41 120.5 58.92 120.48L58.92 84.05C58.93 80.1 58.15 76.2 56.64 72.55C55.13 68.91 52.92 65.6 50.13 62.81C47.97 60.65 46.78 57.79 46.78 54.74C46.78 51.7 47.97 48.83 50.13 46.68C54.57 42.23 61.81 42.23 66.26 46.68L75.19 55.61C75.56 55.99 76.04 56.24 76.56 56.36C77.07 56.47 77.61 56.43 78.11 56.25C78.61 56.06 79.04 55.74 79.36 55.32C79.68 54.89 79.87 54.39 79.91 53.86C80.01 52.54 80.33 51.24 80.88 50.04C81.45 48.79 82.24 47.65 83.21 46.68C87.66 42.23 94.89 42.23 99.34 46.68L108.27 55.61C108.64 55.98 109.12 56.24 109.63 56.36C110.15 56.47 110.69 56.43 111.19 56.25C111.68 56.07 112.12 55.74 112.44 55.32C112.76 54.9 112.95 54.39 112.99 53.86C113.09 52.54 113.42 51.25 113.96 50.04C114.53 48.79 115.32 47.65 116.3 46.68C120.74 42.23 127.98 42.23 132.42 46.68L145.31 59.56C145.83 60.08 146.53 60.37 147.27 60.37C148 60.37 148.7 60.08 149.22 59.56C149.74 59.04 150.03 58.34 150.03 57.6C150.03 56.87 149.74 56.16 149.22 55.64L136.34 42.76C129.73 36.16 118.98 36.16 112.38 42.76C110.81 44.33 109.57 46.18 108.72 48.22L103.26 42.76C96.65 36.16 85.9 36.16 79.29 42.76C77.72 44.33 76.48 46.18 75.63 48.22L70.17 42.76C63.56 36.16 52.81 36.16 46.21 42.76C43.01 45.96 41.25 50.22 41.25 54.74C41.25 59.27 43.01 63.52 46.21 66.72C48.49 69 50.29 71.7 51.52 74.68C52.75 77.65 53.39 80.83 53.38 84.05L53.38 121.31C46.35 123.57 41.25 130.17 41.25 137.95C41.25 147.58 49.08 155.42 58.72 155.42C61.24 155.42 63.68 154.89 65.92 153.87C70.73 167.03 81.8 177.2 95.51 180.77L95.51 196.27C80.84 200.03 68.12 209.56 60.35 222.69C60.1 223.11 59.97 223.59 59.97 224.08C59.96 224.57 60.09 225.05 60.33 225.47C60.57 225.9 60.92 226.25 61.34 226.5C61.77 226.74 62.25 226.87 62.73 226.87L156.79 226.87C157.28 226.87 157.76 226.74 158.18 226.49C158.6 226.25 158.95 225.9 159.19 225.47C159.44 225.05 159.56 224.57 159.56 224.08C159.55 223.59 159.42 223.11 159.17 222.69C151.4 209.56 138.68 200.03 124.01 196.27L124.01 180.77C137.72 177.2 148.79 167.03 153.61 153.87C155.85 154.89 158.29 155.42 160.81 155.42C170.44 155.42 178.28 147.58 178.28 137.95C178.28 130.17 173.17 123.57 166.14 121.31ZM58.72 149.88C52.14 149.88 46.78 144.53 46.78 137.95C46.78 131.37 52.14 126.01 58.72 126.01C60.3 126.01 61.86 126.33 63.31 126.93L63.31 133.18C62.19 132.73 60.96 132.42 59.61 132.29C56.85 132.01 54.59 132.54 54.34 132.6C52.86 132.96 51.95 134.45 52.31 135.93C52.67 137.42 54.16 138.33 55.64 137.98C55.66 137.98 57.31 137.6 59.19 137.81C61.08 138.03 62.44 138.73 63.32 139.94C63.38 142.81 63.72 145.67 64.34 148.47C62.62 149.39 60.71 149.88 58.72 149.88ZM89.84 204L103.94 221.33L67.87 221.33C73.49 213.64 81.12 207.64 89.84 204ZM151.65 221.33L115.59 221.33L129.69 204C138.4 207.64 146.03 213.64 151.65 221.33ZM120.66 201.18C121.83 201.43 122.99 201.72 124.13 202.05L109.76 219.71L95.39 202.05C96.54 201.72 97.69 201.43 98.86 201.18C99.48 201.04 100.03 200.7 100.43 200.21C100.83 199.72 101.05 199.1 101.05 198.47L101.05 181.82C102.78 182.04 104.55 182.15 106.33 182.15L113.19 182.15C114.98 182.15 116.74 182.04 118.47 181.82L118.47 198.47C118.47 199.1 118.69 199.72 119.09 200.21C119.49 200.7 120.05 201.04 120.66 201.18ZM160.81 149.88C158.85 149.88 156.91 149.4 155.19 148.47C155.81 145.67 156.15 142.81 156.2 139.94C157.09 138.73 158.45 138.03 160.33 137.81C162.2 137.6 163.83 137.97 163.88 137.98C164.59 138.14 165.34 138.02 165.96 137.64C166.58 137.25 167.02 136.64 167.19 135.94C167.37 135.23 167.25 134.48 166.88 133.85C166.5 133.23 165.9 132.78 165.19 132.6C164.94 132.54 162.68 132.01 159.91 132.29C158.57 132.42 157.33 132.73 156.21 133.18L156.21 126.93C157.67 126.32 159.23 126.01 160.81 126.01C167.39 126.01 172.74 131.37 172.74 137.95C172.74 144.53 167.39 149.88 160.81 149.88Z" fill="#000000" fill-opacity="1.000000" fill-rule="nonzero"/>
                                <path id="Vector" d="M89.02 123.19C86.33 123.19 84.15 126.18 84.15 129.86C84.15 133.54 86.33 136.53 89.02 136.53C91.7 136.53 93.89 133.54 93.89 129.86C93.89 126.18 91.7 123.19 89.02 123.19ZM130.51 123.19C127.82 123.19 125.64 126.18 125.64 129.86C125.64 133.54 127.82 136.53 130.51 136.53C133.2 136.53 135.38 133.54 135.38 129.86C135.38 126.18 133.2 123.19 130.51 123.19ZM97.24 117.47C97.76 116.95 98.05 116.25 98.05 115.51C98.05 114.78 97.76 114.07 97.24 113.55C92.86 109.18 85.75 109.18 81.37 113.55C80.86 114.07 80.57 114.78 80.57 115.51C80.57 116.24 80.86 116.94 81.38 117.46C81.9 117.98 82.6 118.27 83.33 118.27C84.07 118.27 84.77 117.99 85.29 117.47C87.5 115.26 91.11 115.26 93.32 117.47C93.86 118.01 94.57 118.28 95.28 118.28C95.99 118.28 96.7 118.01 97.24 117.47ZM138.57 109.73C138.83 109.47 139.03 109.17 139.17 108.83C139.31 108.5 139.39 108.14 139.39 107.77C139.39 107.41 139.31 107.05 139.17 106.71C139.03 106.38 138.83 106.07 138.57 105.81C136.46 103.7 133.64 102.53 130.64 102.53C127.65 102.53 124.83 103.7 122.71 105.81C122.19 106.34 121.91 107.04 121.91 107.77C121.91 108.5 122.2 109.21 122.72 109.72C123.24 110.24 123.94 110.53 124.67 110.53C125.4 110.54 126.11 110.25 126.63 109.73C127.15 109.2 127.78 108.78 128.47 108.5C129.16 108.21 129.9 108.07 130.64 108.07C132.16 108.07 133.58 108.66 134.66 109.73C134.91 109.99 135.22 110.19 135.56 110.33C135.89 110.47 136.25 110.54 136.62 110.54C136.98 110.54 137.34 110.47 137.68 110.33C138.01 110.19 138.32 109.99 138.57 109.73ZM109.76 149.39C114.9 149.39 119.51 145.95 120.97 141.03C121.08 140.69 121.11 140.32 121.07 139.96C121.04 139.6 120.93 139.25 120.75 138.93C120.58 138.61 120.35 138.32 120.06 138.1C119.78 137.87 119.46 137.7 119.11 137.59C118.76 137.49 118.39 137.45 118.03 137.49C117.67 137.53 117.32 137.64 117 137.81C116.68 137.99 116.4 138.22 116.17 138.5C115.94 138.78 115.77 139.11 115.66 139.46C114.9 142.04 112.47 143.85 109.76 143.85C107.06 143.85 104.63 142.04 103.86 139.46C103.76 139.11 103.59 138.78 103.36 138.5C103.13 138.22 102.85 137.98 102.53 137.81C102.21 137.64 101.85 137.53 101.49 137.49C101.13 137.45 100.77 137.49 100.42 137.59C100.07 137.7 99.74 137.87 99.46 138.1C99.18 138.33 98.94 138.61 98.77 138.93C98.6 139.25 98.49 139.6 98.45 139.96C98.41 140.32 98.45 140.69 98.55 141.04C100.02 145.95 104.63 149.39 109.76 149.39Z" fill="#000000" fill-opacity="1.000000" fill-rule="nonzero"/>
                            </g>
                        </svg>
                    </div>
                    <span class="block whitespace-nowrap w-36 h-12 py-[7px] font-jakarta font-semibold text-xl text-white">
                        Good Evening,
                        <br/> 
                        {user.login}!
                    </span>
                    <div class="flex flex-col items-center ml-20 mt-5">
                        <svg width="47.000000" height="30.000000" viewBox="0 0 47 30" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                            <desc>
                                    Created with Pixso.
                            </desc>
                            <defs>
                                <clipPath id="clip33_328">
                                    <rect id="Frame" width="47.000000" height="30.000000" fill="white" fill-opacity="0"/>
                                </clipPath>
                            </defs>
                            <rect id="Frame" width="47.000000" height="30.000000" fill="#FFFFFF" fill-opacity="0"/>
                            <g clip-path="url(#clip33_328)">
                                <path id="Vector" d="M23.51 2.47C23.17 2.48 22.84 2.61 22.59 2.84C22.35 3.03 22.18 3.26 22.01 3.51C21.68 4.02 21.39 4.63 21.12 5.25C20.85 5.87 20.58 6.49 20.34 6.99C20.2 7.29 20.02 7.57 19.82 7.84C19.5 7.95 19.18 8.03 18.84 8.07C18.3 8.15 17.62 8.2 16.95 8.27C16.3 8.31 15.66 8.41 15.02 8.57C14.74 8.64 14.46 8.75 14.2 8.91C13.9 9.08 13.68 9.35 13.56 9.67C13.46 10 13.49 10.35 13.63 10.67C13.74 10.94 13.9 11.19 14.09 11.42C14.47 11.89 14.96 12.35 15.47 12.81C15.97 13.25 16.49 13.7 16.88 14.08C17.27 14.46 17.52 14.84 17.53 14.85C17.53 14.85 17.55 15.3 17.45 15.84C17.35 16.38 17.19 17.04 17.05 17.7C16.9 18.36 16.77 19.02 16.74 19.63C16.72 19.93 16.73 20.22 16.8 20.52C16.87 20.85 17.06 21.15 17.33 21.36C17.64 21.58 18 21.63 18.3 21.61C18.6 21.59 18.88 21.51 19.17 21.4C19.73 21.19 20.32 20.86 20.9 20.52C21.49 20.18 22.07 19.82 22.55 19.57C23.04 19.31 23.47 19.19 23.48 19.19C23.49 19.19 23.92 19.31 24.4 19.57C24.89 19.83 25.46 20.19 26.05 20.53C26.63 20.87 27.22 21.2 27.78 21.42C28.07 21.53 28.35 21.61 28.65 21.63C28.99 21.67 29.33 21.58 29.61 21.39C29.89 21.18 30.08 20.88 30.15 20.54C30.22 20.25 30.23 19.96 30.22 19.66C30.17 19.01 30.07 18.36 29.92 17.73C29.77 17.07 29.62 16.41 29.52 15.87C29.46 15.54 29.44 15.21 29.45 14.87C29.45 14.86 29.7 14.48 30.1 14.1C30.49 13.73 31.01 13.29 31.52 12.84C32.02 12.39 32.51 11.93 32.9 11.46C33.09 11.23 33.25 10.98 33.37 10.7C33.51 10.39 33.53 10.04 33.43 9.71C33.32 9.38 33.09 9.11 32.8 8.94C32.54 8.79 32.27 8.67 31.98 8.6C31.34 8.45 30.7 8.34 30.05 8.29C29.38 8.22 28.7 8.17 28.16 8.09C27.83 8.05 27.5 7.96 27.19 7.85C26.98 7.59 26.81 7.3 26.66 7C26.42 6.51 26.16 5.88 25.89 5.26C25.65 4.66 25.35 4.08 25.01 3.52C24.85 3.27 24.66 3.04 24.44 2.84C24.18 2.61 23.85 2.48 23.51 2.47ZM7.84 10.67C7.55 10.68 7.27 10.8 7.06 10.99C6.89 11.15 6.74 11.32 6.62 11.52C6.38 11.92 6.17 12.34 6 12.77C5.82 13.21 5.64 13.65 5.49 13.99C5.37 14.25 5.22 14.44 5.19 14.49C5.12 14.51 4.9 14.59 4.62 14.64C4.26 14.69 3.78 14.74 3.31 14.79C2.84 14.85 2.37 14.91 1.93 15.03C1.71 15.09 1.5 15.18 1.31 15.3C1.06 15.46 0.87 15.69 0.78 15.97C0.7 16.25 0.72 16.55 0.84 16.81C0.94 17.04 1.06 17.22 1.21 17.39C1.49 17.73 1.85 18.05 2.21 18.36C2.57 18.67 2.93 18.97 3.21 19.23C3.41 19.42 3.55 19.61 3.6 19.66C3.59 19.74 3.6 19.97 3.56 20.25C3.5 20.62 3.39 21.08 3.3 21.54C3.2 22 3.13 22.46 3.1 22.93C3.09 23.15 3.11 23.38 3.16 23.61C3.23 23.84 3.36 24.12 3.63 24.31C3.9 24.5 4.21 24.54 4.46 24.52C4.69 24.49 4.91 24.43 5.12 24.34C5.54 24.18 5.95 23.94 6.36 23.69C6.76 23.45 7.16 23.19 7.49 23.01C7.73 22.88 7.96 22.81 8.02 22.78C8.09 22.81 8.32 22.87 8.57 23C8.9 23.16 9.3 23.41 9.72 23.64C10.13 23.87 10.55 24.1 10.97 24.25C11.18 24.33 11.4 24.39 11.64 24.4C11.89 24.42 12.2 24.38 12.46 24.18C12.69 24 12.85 23.74 12.9 23.46C12.95 23.23 12.97 23 12.95 22.78C12.91 22.31 12.83 21.85 12.71 21.4C12.6 20.93 12.49 20.48 12.42 20.12C12.36 19.84 12.36 19.59 12.36 19.53L12.36 19.53C12.4 19.48 12.54 19.28 12.73 19.08C13 18.82 13.35 18.51 13.7 18.19C14.05 17.87 14.4 17.54 14.67 17.18C14.82 17 14.94 16.81 15.02 16.59C15.14 16.33 15.15 16.03 15.06 15.75C14.96 15.47 14.77 15.25 14.51 15.1C14.31 14.99 14.1 14.9 13.87 14.85C13.44 14.74 12.97 14.69 12.49 14.65C12.02 14.61 11.55 14.58 11.18 14.54C10.89 14.5 10.67 14.42 10.61 14.41C10.57 14.35 10.42 14.16 10.29 13.91C10.13 13.58 9.94 13.15 9.74 12.72C9.56 12.29 9.34 11.88 9.09 11.48C8.96 11.29 8.81 11.12 8.63 10.97C8.41 10.78 8.13 10.67 7.84 10.67ZM39.15 10.67C38.86 10.67 38.58 10.78 38.36 10.97C38.18 11.12 38.03 11.29 37.9 11.48C37.65 11.86 37.45 12.28 37.25 12.72C37.05 13.15 36.87 13.58 36.7 13.91C36.57 14.16 36.42 14.35 36.39 14.41C36.33 14.42 36.1 14.5 35.81 14.54C35.45 14.58 34.97 14.61 34.5 14.65C34.03 14.68 33.57 14.75 33.12 14.85C32.89 14.9 32.68 14.99 32.48 15.1C32.23 15.24 32.03 15.47 31.93 15.75C31.84 16.02 31.86 16.32 31.97 16.59C32.05 16.81 32.17 17 32.32 17.18C32.59 17.54 32.94 17.87 33.29 18.19C33.64 18.51 33.99 18.82 34.26 19.08C34.45 19.28 34.59 19.48 34.63 19.53C34.63 19.59 34.63 19.84 34.58 20.12C34.51 20.48 34.39 20.93 34.28 21.4C34.17 21.86 34.07 22.33 34.04 22.78C34.02 23 34.04 23.23 34.09 23.46C34.14 23.7 34.27 23.98 34.53 24.18C34.77 24.35 35.06 24.43 35.35 24.4C35.58 24.39 35.8 24.34 36.01 24.25C36.44 24.1 36.86 23.87 37.27 23.64C37.69 23.41 38.09 23.17 38.42 23C38.67 22.87 38.9 22.8 38.97 22.78C39.03 22.81 39.26 22.88 39.51 23.01C39.83 23.19 40.23 23.45 40.64 23.69C41.04 23.94 41.45 24.18 41.87 24.34C42.08 24.43 42.29 24.49 42.53 24.52C42.78 24.54 43.09 24.5 43.36 24.31C43.59 24.14 43.76 23.89 43.83 23.61C43.88 23.38 43.9 23.15 43.89 22.93C43.86 22.46 43.8 22 43.69 21.54C43.6 21.08 43.5 20.62 43.44 20.25C43.39 19.97 43.4 19.73 43.4 19.67C43.44 19.61 43.58 19.41 43.79 19.23C44.06 18.97 44.42 18.67 44.78 18.36C45.14 18.05 45.5 17.73 45.78 17.39C45.93 17.22 46.06 17.02 46.15 16.81C46.25 16.59 46.31 16.28 46.21 15.97C46.11 15.65 45.89 15.44 45.68 15.3C45.49 15.18 45.28 15.09 45.05 15.03C44.6 14.91 44.14 14.83 43.68 14.79C43.21 14.73 42.74 14.69 42.37 14.64C42.09 14.59 41.87 14.51 41.8 14.49C41.77 14.44 41.62 14.24 41.5 13.98C41.35 13.65 41.17 13.21 40.99 12.77C40.82 12.34 40.61 11.92 40.37 11.52C40.25 11.32 40.11 11.15 39.93 10.99C39.72 10.8 39.44 10.68 39.15 10.67Z" fill="#FFD241" fill-opacity="1.000000" fill-rule="nonzero"/>
                            </g>
                        </svg>
                        <span class="font-jakarta font-bold text-[15px] text-white">4,97</span>
                    </div>
                </div>    
                <div class="relative w-[380px] h-[100px] bg-yellow-app mx-6 mt-4 rounded-md">
                    <span class="block font-jakarta font-semibold text-lg pt-4 pl-4">
                        Your location:
                    </span>
                    {#if !clicked}
                        <button on:click={() => {clicked = !clicked}}>
                            <span class="block font-jakarta font-semibold text-[26px] pl-4 mt-1.5">
                                {currentDest + destCity}
                            </span>
                        </button>
                    {:else}
                        <input bind:value={destValue} bind:this={destRef} on:blur={handleDestBlurInput} 
                            on:keydown={handleDestInput} class="w-[380px] h-[46px]" placeholder="Where would you like to start?"/>
                    {/if}
                    <button on:click={() => {clicked = !clicked}} class="absolute right-6 top-9 {clicked ? 'hidden' : ''}">
                        <svg width="31.000000" height="31.000000" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                            <desc>
                                    Created with Pixso.
                            </desc>
                            <defs/>
                            <path id="Vector" d="M28.5 16.11C28.27 16.08 28.03 16.09 27.8 16.14C27.58 16.19 27.36 16.29 27.18 16.42C26.99 16.56 26.83 16.73 26.71 16.92C26.59 17.11 26.52 17.33 26.48 17.55C26.12 19.89 24.98 22.06 23.23 23.72C21.06 25.8 18.13 26.97 15.07 26.97C12 26.97 9.07 25.8 6.9 23.72C4.74 21.64 3.52 18.82 3.52 15.88C3.52 12.94 4.74 10.12 6.9 8.04C8.59 6.42 10.77 5.34 13.12 4.97C14.21 4.78 15.31 4.75 16.41 4.88C17.95 5.06 19.44 5.54 20.79 6.29L18.48 6.67C18.24 6.7 18.02 6.78 17.82 6.9C17.62 7.02 17.44 7.18 17.31 7.36C17.17 7.54 17.07 7.75 17.02 7.97C16.97 8.19 16.96 8.42 17 8.64C17.04 8.87 17.12 9.08 17.25 9.27C17.38 9.46 17.54 9.63 17.73 9.76C17.93 9.88 18.15 9.98 18.38 10.02C18.61 10.07 18.84 10.07 19.08 10.03L25.28 9.02C25.74 8.94 26.15 8.69 26.43 8.32C26.7 7.95 26.81 7.49 26.73 7.05L25.67 1.09C25.63 0.86 25.56 0.65 25.43 0.45C25.31 0.25 25.15 0.08 24.96 -0.05C24.76 -0.19 24.55 -0.29 24.31 -0.34C24.08 -0.39 23.84 -0.4 23.61 -0.36C23.37 -0.32 23.15 -0.24 22.95 -0.11C22.74 0.01 22.57 0.17 22.44 0.36C22.3 0.55 22.21 0.76 22.16 0.99C22.12 1.21 22.12 1.44 22.17 1.67L22.44 3.24C20.71 2.3 18.79 1.7 16.81 1.49C15.37 1.32 13.92 1.36 12.5 1.61C9.42 2.1 6.59 3.51 4.39 5.63C-1.5 11.28 -1.5 20.48 4.39 26.14C5.79 27.48 7.45 28.55 9.29 29.28C11.12 30.01 13.08 30.38 15.07 30.38C17.05 30.38 19.01 30.01 20.85 29.28C22.68 28.55 24.34 27.48 25.74 26.14C28.04 23.95 29.53 21.11 30 18.05C30.07 17.6 29.95 17.14 29.67 16.78C29.39 16.42 28.97 16.18 28.5 16.11L28.5 16.11Z" fill="#000000" fill-opacity="1.000000" fill-rule="nonzero"/>
                        </svg>
                    </button>
                </div>
                <div class="relative w-[400px] h-64 mx-[14px] mt-5">
                    <Map bind:this={mapRefPrimary} rounded />
                    <div class="absolute bottom-0 w-[400px] h-12 bg-yellow-app font-jakarta font-medium text-xl text-center leading-[46px] rounded-b-md">
                        <b>Home: </b>Prząśniczki 2,20-838 Lublin
                    </div>
                </div>
                <input bind:value={inputValue} on:keydown={handleInput} class="w-[380px] h-[46px] mx-6 mt-5" placeholder="Where would you like to go?"/>
                <span class="text-white font-semibold text-2xl mx-6 mt-4">Your locations</span>
                <hr style="border-color: rgb(127, 127, 127);" class="w-[380px] mx-6 mt-3 "/>
                <div class="flex flex-row mx-6 mt-5 gap-2">
                    <button>
                        <div class="flex flex-row items-center justify-center h-[52px] border-yellow-app border-2 border-solid rounded-md gap-2">
                            <svg class="ml-3" width="32.000000" height="32.000000" viewBox="0 0 28 25" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                <desc>
                                        Created with Pixso.
                                </desc>
                                <defs/>
                                <path id="Vector" d="M14 24.21C13.85 24.21 13.71 24.17 13.58 24.1C13.45 24.02 10.17 22.12 6.85 19.26C4.88 17.56 3.31 15.87 2.18 14.25C0.72 12.15 -0.02 10.13 0 8.25C0.01 6.05 0.79 3.99 2.21 2.44C3.64 0.86 5.56 0 7.6 0C10.22 0 12.62 1.46 14 3.79C15.37 1.46 17.77 0 20.39 0C22.32 0 24.16 0.78 25.58 2.2C27.13 3.76 28.01 5.97 28 8.26C27.98 10.14 27.23 12.16 25.77 14.25C24.63 15.88 23.06 17.56 21.1 19.26C17.79 22.12 14.54 24.02 14.41 24.1C14.28 24.17 14.14 24.21 14 24.21Z" fill="#FFD241" fill-opacity="1.000000" fill-rule="nonzero"/>
                            </svg>
                            <span class="mr-3 text-white font-semibold text-[17px]">
                                Parents
                            </span>
                        </div>
                    </button>
                    <button>
                        <div class="flex flex-row items-center justify-center h-[52px] border-yellow-app border-2 border-solid rounded-md gap-2">
                        <svg class="ml-3" width="32.000000" height="32.000000" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                            <desc>
                                    Created with Pixso.
                            </desc>
                            <defs/>
                            <path id="Vector" d="M29.45 14.12L17.12 2.45C16.82 2.16 16.41 2 16 2C15.58 2 15.17 2.16 14.87 2.45L2.54 14.12C2.26 14.39 2.07 14.76 2.01 15.16C1.96 15.56 2.03 15.96 2.23 16.31C2.39 16.57 2.61 16.79 2.87 16.94C3.13 17.09 3.43 17.17 3.72 17.16L5.35 17.16L5.35 28.25C5.35 28.71 5.53 29.15 5.85 29.48C6.16 29.81 6.59 30 7.04 30L10.96 30C11.4 30 11.83 29.81 12.14 29.48C12.46 29.15 12.64 28.71 12.64 28.25L12.64 21.83C12.64 21.36 12.81 20.92 13.13 20.59C13.44 20.26 13.87 20.08 14.31 20.08L17.68 20.08C18.12 20.08 18.55 20.26 18.86 20.59C19.18 20.92 19.35 21.36 19.35 21.83L19.35 28.25C19.35 28.71 19.53 29.15 19.85 29.48C20.16 29.81 20.59 30 21.04 30L24.96 30C25.4 30 25.83 29.81 26.14 29.48C26.46 29.15 26.64 28.71 26.64 28.25L26.64 17.16L28.27 17.16C28.56 17.17 28.86 17.09 29.12 16.94C29.38 16.79 29.6 16.57 29.76 16.31C29.96 15.96 30.03 15.56 29.98 15.16C29.92 14.76 29.73 14.39 29.45 14.12Z" fill="#FFD241" fill-opacity="1.000000" fill-rule="nonzero"/>
                        </svg>            
                        <span class="mr-3 text-white font-semibold text-[17px]">
                            Home
                        </span>
                        </div>
                    </button>
                    <button>
                        <div class="flex flex-row items-center justify-center h-[52px] border-yellow-app border-2 border-solid rounded-md gap-2">
                        <svg class="ml-3" width="32.000000" height="32.000000" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                            <desc>
                                    Created with Pixso.
                            </desc>
                            <defs>
                                <clipPath id="clip11_1017">
                                    <rect id="work icon" width="32.000000" height="32.000000" fill="white" fill-opacity="0"/>
                                </clipPath>
                            </defs>
                            <rect id="work icon" width="32.000000" height="32.000000" fill="#FFFFFF" fill-opacity="0"/>
                            <g clip-path="url(#clip11_1017)">
                                <path id="Vector" d="M13.92 16.79L18.72 16.79L18.72 18.4L13.92 18.4L13.92 16.79Z" fill="#FFD241" fill-opacity="1.000000" fill-rule="nonzero"/>
                                <path id="Vector" d="M24.81 18.4L20.31 18.4L20.31 19.2C20.31 19.64 19.96 20 19.52 20L13.11 20C12.67 20 12.31 19.64 12.31 19.2L12.31 18.4L7.81 18.4C7.31 18.4 6.82 18.24 6.41 17.94C6 17.65 5.7 17.23 5.54 16.75L2.66 8.12L2.66 25.6C2.66 26.92 3.74 28 5.06 28L27.57 28C28.89 28 29.97 26.92 29.97 25.6L29.97 8.12L27.09 16.75C26.93 17.23 26.63 17.65 26.22 17.94C25.81 18.24 25.32 18.4 24.82 18.4L24.81 18.4Z" fill="#FFD241" fill-opacity="1.000000" fill-rule="nonzero"/>
                                <path id="Vector" d="M19.52 4L13.12 4C11.79 4 10.72 5.07 10.72 6.4L10.72 7.19L4.04 7.19L7.06 16.25C7.11 16.41 7.21 16.55 7.35 16.64C7.48 16.74 7.65 16.79 7.81 16.79L12.32 16.79L12.32 16C12.32 15.55 12.67 15.2 13.12 15.2L19.52 15.2C19.96 15.2 20.32 15.55 20.32 16L20.32 16.79L24.82 16.79C25.16 16.79 25.47 16.58 25.58 16.25L28.59 7.19L21.92 7.19L21.92 6.4C21.92 5.07 20.84 4 19.52 4ZM12.32 7.19L12.32 6.4C12.32 5.95 12.67 5.59 13.12 5.59L19.52 5.59C19.96 5.59 20.32 5.95 20.32 6.4L20.32 7.19L12.32 7.19Z" fill="#FFD241" fill-opacity="1.000000" fill-rule="nonzero"/>
                            </g>
                        </svg>            
                        <span class="mr-3 text-white font-semibold text-[17px]">
                            Work
                        </span>
                        </div>
                    </button>
                </div>
                <Navbar on:handleTripPage={() => {
                    const trimmedValue = inputValue.trim();
                    if (trimmedValue !== '') {
                        state = 2;
                    }
                }} activePage={Pages.Home}/>
            </div>
        </div>
        {:else if state === 2}
        <!-- TRIP -->
        <div id="page-background">
            <div id="main-container-col">
                <div class="flex flex-row items-center gap-[18.6vw]">
                    <a href="/home">
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-arrow-left" width="48" height="48" viewBox="0 0 24 24" stroke-width="2" stroke="#FFD241" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M5 12l14 0" />
                            <path d="M5 12l6 6" />
                            <path d="M5 12l6 -6" />
                        </svg>
                    </a>
                    <span class="text-3xl text-white font-semibold">
                        Your trip
                    </span>
                </div>
                <div class="mt-[6vw] flex flex-col items-center">
                    <div class="w-[380px] h-[100px] flex flex-col bg-yellow-app p-4 gap-2 rounded-md">
                        <span class="text-lg font-semibold">Your location:</span>
                        <span class="text-[26px] leading-[33px] font-semibold">{currentDest + destCity}</span>
                        <button class="absolute right-12 mt-3">
                            <svg width="31.000000" height="31.000000" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                <desc>
                                        Created with Pixso.
                                </desc>
                                <defs/>
                                <path id="Vector" d="M28.5 16.11C28.27 16.08 28.03 16.09 27.8 16.14C27.58 16.19 27.36 16.29 27.18 16.42C26.99 16.56 26.83 16.73 26.71 16.92C26.59 17.11 26.52 17.33 26.48 17.55C26.12 19.89 24.98 22.06 23.23 23.72C21.06 25.8 18.13 26.97 15.07 26.97C12 26.97 9.07 25.8 6.9 23.72C4.74 21.64 3.52 18.82 3.52 15.88C3.52 12.94 4.74 10.12 6.9 8.04C8.59 6.42 10.77 5.34 13.12 4.97C14.21 4.78 15.31 4.75 16.41 4.88C17.95 5.06 19.44 5.54 20.79 6.29L18.48 6.67C18.24 6.7 18.02 6.78 17.82 6.9C17.62 7.02 17.44 7.18 17.31 7.36C17.17 7.54 17.07 7.75 17.02 7.97C16.97 8.19 16.96 8.42 17 8.64C17.04 8.87 17.12 9.08 17.25 9.27C17.38 9.46 17.54 9.63 17.73 9.76C17.93 9.88 18.15 9.98 18.38 10.02C18.61 10.07 18.84 10.07 19.08 10.03L25.28 9.02C25.74 8.94 26.15 8.69 26.43 8.32C26.7 7.95 26.81 7.49 26.73 7.05L25.67 1.09C25.63 0.86 25.56 0.65 25.43 0.45C25.31 0.25 25.15 0.08 24.96 -0.05C24.76 -0.19 24.55 -0.29 24.31 -0.34C24.08 -0.39 23.84 -0.4 23.61 -0.36C23.37 -0.32 23.15 -0.24 22.95 -0.11C22.74 0.01 22.57 0.17 22.44 0.36C22.3 0.55 22.21 0.76 22.16 0.99C22.12 1.21 22.12 1.44 22.17 1.67L22.44 3.24C20.71 2.3 18.79 1.7 16.81 1.49C15.37 1.32 13.92 1.36 12.5 1.61C9.42 2.1 6.59 3.51 4.39 5.63C-1.5 11.28 -1.5 20.48 4.39 26.14C5.79 27.48 7.45 28.55 9.29 29.28C11.12 30.01 13.08 30.38 15.07 30.38C17.05 30.38 19.01 30.01 20.85 29.28C22.68 28.55 24.34 27.48 25.74 26.14C28.04 23.95 29.53 21.11 30 18.05C30.07 17.6 29.95 17.14 29.67 16.78C29.39 16.42 28.97 16.18 28.5 16.11L28.5 16.11Z" fill="#000000" fill-opacity="1.000000" fill-rule="nonzero"/>
                            </svg>
                        </button>
                    </div>
                    <div class="w-screen h-[300px] mt-[2vh]">
                        <Map on:handleMapError={() => {state = 1; tripBtnState = false}} on:handleMapSuccess={() => {tripBtnState = true}} bind:this={mapRef} handlePriceCalculation={calculatePrice}/>
                    </div>
                    <div class="flex flex-col w-[380px] mt-[2.5vh] gap-[1.5vh]">
                        <div class="flex flex-row items-center px-4 w-full h-[45px] border-yellow-app border-2 rounded-md text-white font-semibold text-base">
                            Your location: <b class="ml-1 text-xl">{currentDest + destCity}</b>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" class="rotate-[-90deg] icon icon-tabler icon-tabler-arrow-left" width="32" height="32" viewBox="0 0 24 24" stroke-width="2" stroke="#FFD241" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M5 12l14 0" />
                            <path d="M5 12l6 6" />
                            <path d="M5 12l6 -6" />
                        </svg>
                        <div class="flex flex-row items-center px-4 w-full h-[45px] border-yellow-app border-2 rounded-md text-white font-semibold text-base">
                            Your destination: <b class="ml-1 text-xl">{inputValue + destCity}</b>
                        </div>
                    </div>
                </div>
                <div class="flex flex-row justify-center mt-[2vh]">
                    {#if tripBtnState}
                        <button on:click={handleCreateTrip} class="w-[175px] h-[57px] bg-yellow-app rounded-md font-extrabold text-xl">
                            Accept trip
                        </button>
                    {/if}
                </div>
            </div>
            <Navbar on:handleHomePage={() => {state = 1}} activePage={Pages.Trip}/>
        </div>
        {:else if state === 3}
        {#if trip}
         <!--on the road to destination  -->
        <div id="page-background">
            <div id="main-container-col">
                <div class="flex flex-row items-center gap-[18.6vw]">
                    <a href="/home">
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-arrow-left" width="48" height="48" viewBox="0 0 24 24" stroke-width="2" stroke="#FFD241" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M5 12l14 0" />
                            <path d="M5 12l6 6" />
                            <path d="M5 12l6 -6" />
                        </svg>
                    </a>
                    <span class="text-3xl text-white font-semibold">
                        Your trip
                    </span>
                </div>
                <div class="mt-[6vw] flex flex-col items-center">
                    <div class="w-[380px] h-[100px] flex flex-col bg-yellow-app p-4 gap-2 rounded-md">
                        <span class="text-lg font-semibold">Your location:</span>
                        <span class="text-[26px] leading-[33px] font-semibold">{trip.startAddress}</span>
                        <button class="absolute right-12 mt-3">
                            <svg width="31.000000" height="31.000000" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                <desc>
                                        Created with Pixso.
                                </desc>
                                <defs/>
                                <path id="Vector" d="M28.5 16.11C28.27 16.08 28.03 16.09 27.8 16.14C27.58 16.19 27.36 16.29 27.18 16.42C26.99 16.56 26.83 16.73 26.71 16.92C26.59 17.11 26.52 17.33 26.48 17.55C26.12 19.89 24.98 22.06 23.23 23.72C21.06 25.8 18.13 26.97 15.07 26.97C12 26.97 9.07 25.8 6.9 23.72C4.74 21.64 3.52 18.82 3.52 15.88C3.52 12.94 4.74 10.12 6.9 8.04C8.59 6.42 10.77 5.34 13.12 4.97C14.21 4.78 15.31 4.75 16.41 4.88C17.95 5.06 19.44 5.54 20.79 6.29L18.48 6.67C18.24 6.7 18.02 6.78 17.82 6.9C17.62 7.02 17.44 7.18 17.31 7.36C17.17 7.54 17.07 7.75 17.02 7.97C16.97 8.19 16.96 8.42 17 8.64C17.04 8.87 17.12 9.08 17.25 9.27C17.38 9.46 17.54 9.63 17.73 9.76C17.93 9.88 18.15 9.98 18.38 10.02C18.61 10.07 18.84 10.07 19.08 10.03L25.28 9.02C25.74 8.94 26.15 8.69 26.43 8.32C26.7 7.95 26.81 7.49 26.73 7.05L25.67 1.09C25.63 0.86 25.56 0.65 25.43 0.45C25.31 0.25 25.15 0.08 24.96 -0.05C24.76 -0.19 24.55 -0.29 24.31 -0.34C24.08 -0.39 23.84 -0.4 23.61 -0.36C23.37 -0.32 23.15 -0.24 22.95 -0.11C22.74 0.01 22.57 0.17 22.44 0.36C22.3 0.55 22.21 0.76 22.16 0.99C22.12 1.21 22.12 1.44 22.17 1.67L22.44 3.24C20.71 2.3 18.79 1.7 16.81 1.49C15.37 1.32 13.92 1.36 12.5 1.61C9.42 2.1 6.59 3.51 4.39 5.63C-1.5 11.28 -1.5 20.48 4.39 26.14C5.79 27.48 7.45 28.55 9.29 29.28C11.12 30.01 13.08 30.38 15.07 30.38C17.05 30.38 19.01 30.01 20.85 29.28C22.68 28.55 24.34 27.48 25.74 26.14C28.04 23.95 29.53 21.11 30 18.05C30.07 17.6 29.95 17.14 29.67 16.78C29.39 16.42 28.97 16.18 28.5 16.11L28.5 16.11Z" fill="#000000" fill-opacity="1.000000" fill-rule="nonzero"/>
                            </svg>
                        </button>
                    </div>
                    <div class="w-screen h-[400px] mt-[2vh]">
                        <Map on:handleMapError={() => {state = 1; tripBtnState = false}} on:handleMapSuccess={() => {tripBtnState = true}} bind:this={mapRef} handlePriceCalculation={() => {
                            console.log("test");
                        }}/>
                    </div>
                    <div class="flex flex-col pt-5 pb-[52px] gap-4">
                        <div class="flex flex-row items-center">
                            <svg width="64.000000" height="64.000000" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                <desc>
                                        Created with Pixso.
                                </desc>
                                <defs/>
                                <circle id="Ellipse 1" cx="32.000000" cy="32.000000" r="32.000000" fill="#FFD241" fill-opacity="1.000000"/>
                                <mask id="mask59_6488" mask-type="alpha" maskUnits="userSpaceOnUse" x="0.000000" y="0.000000" width="64.000000" height="64.000000">
                                    <circle id="Ellipse 2" cx="32.000000" cy="32.000000" r="32.000000" fill="#E65C5C" fill-opacity="1.000000"/>
                                </mask>
                                <g mask="url(#mask59_6488)">
                                    <path id="Vector" d="M47.01 50.91L38.77 48.19C38.28 48.03 37.85 47.7 37.55 47.25C37.25 46.79 37.08 46.24 37.08 45.67L37.08 41.5L26.13 41.5L26.13 45.67C26.13 46.24 25.97 46.79 25.67 47.25C25.36 47.7 24.94 48.03 24.45 48.19L16.21 50.91C14.21 51.57 12.84 53.63 12.84 55.96L12.84 65.17L50.38 65.17L50.38 55.96C50.38 53.63 49 51.57 47.01 50.91Z" fill="#E3AA75" fill-opacity="1.000000" fill-rule="nonzero"/>
                                    <path id="Vector" d="M47.01 50.91L38.77 48.19C38.63 48.15 38.5 48.09 38.37 48.01L31.61 49.39L24.85 48.01C24.72 48.09 24.59 48.15 24.45 48.19L16.21 50.91C14.21 51.57 12.84 53.63 12.84 55.96L12.84 65.17L50.38 65.17L50.38 55.96C50.38 53.63 49.01 51.57 47.01 50.91Z" fill="#E6646E" fill-opacity="1.000000" fill-rule="nonzero"/>
                                    <path id="Vector" d="M25.72 54.59C26.43 55.27 27.34 55.65 28.27 55.65C29.46 55.65 30.58 55.05 31.32 54L31.61 53.6L31.89 54C32.64 55.05 33.75 55.65 34.95 55.65C35.88 55.65 36.78 55.27 37.49 54.59L41.37 50.87C41.78 50.48 42.08 49.96 42.25 49.37L42.26 49.35L38.77 48.19C38.63 48.15 38.5 48.09 38.37 48.01L31.61 49.39L24.85 48.01C24.72 48.09 24.59 48.15 24.45 48.19L20.96 49.35L20.96 49.37C21.13 49.96 21.44 50.48 21.85 50.87L25.72 54.59Z" fill="#DC4655" fill-opacity="1.000000" fill-rule="nonzero"/>
                                    <path id="Vector" d="M26.13 44.34C27.78 45.32 29.64 45.89 31.61 45.89C33.58 45.89 35.44 45.32 37.08 44.34L37.08 41.5L26.13 41.5L26.13 44.34Z" fill="#D29B6E" fill-opacity="1.000000" fill-rule="nonzero"/>
                                    <path id="Vector" d="M42.95 28.35L41.77 28.35L41.77 18.71L21.44 18.71L21.44 28.35L20.27 28.35C19.19 28.35 18.31 29.33 18.31 30.54C18.31 31.75 19.19 32.73 20.27 32.73L21.48 32.73C21.88 38.62 26.26 43.26 31.61 43.26C36.96 43.26 41.33 38.62 41.73 32.73L42.95 32.73C44.03 32.73 44.9 31.75 44.9 30.54C44.9 29.33 44.03 28.35 42.95 28.35Z" fill="#F5B97D" fill-opacity="1.000000" fill-rule="nonzero"/>
                                    <path id="Vector" d="M21.44 18.71L21.44 28.35L20.27 28.35C19.19 28.35 18.31 29.33 18.31 30.54C18.31 31.75 19.19 32.73 20.27 32.73L21.48 32.73C21.88 38.62 26.26 43.26 31.61 43.26C32.14 43.26 32.66 43.2 33.18 43.11C28.3 42.26 24.57 37.56 24.57 31.86L24.57 26.6C24.57 24.66 25.97 23.09 27.7 23.09L37.08 23.09C37.95 23.09 38.65 22.3 38.65 21.34L38.65 18.71L21.44 18.71Z" fill="#E3AA75" fill-opacity="1.000000" fill-rule="nonzero"/>
                                    <path id="Vector" d="M31.61 49.39L25.28 45.45C24.89 45.21 24.4 45.38 24.2 45.83L23.22 48.03C23.16 48.17 23.14 48.33 23.17 48.48C23.2 48.63 23.27 48.77 23.38 48.87L27.25 52.6C27.92 53.24 28.94 53.13 29.49 52.36L31.61 49.39Z" fill="#E6646E" fill-opacity="1.000000" fill-rule="nonzero"/>
                                    <path id="Vector" d="M31.61 49.39L37.93 45.45C38.32 45.21 38.81 45.38 39.01 45.83L39.99 48.03C40.05 48.17 40.07 48.33 40.05 48.48C40.02 48.63 39.95 48.77 39.84 48.87L35.96 52.6C35.29 53.24 34.28 53.13 33.73 52.36L31.61 49.39Z" fill="#E6646E" fill-opacity="1.000000" fill-rule="nonzero"/>
                                    <path id="Vector" d="M28.09 34.12C28.09 36.06 29.66 37.63 31.61 37.63C33.55 37.63 35.13 36.06 35.13 34.12L28.09 34.12Z" fill="#FFFFFF" fill-opacity="1.000000" fill-rule="nonzero"/>
                                    <path id="Vector" d="M40.37 17.83L22.85 17.83C20.46 17.83 18.63 19.33 18.98 21.98L19.88 28.78L21.63 28.54C22.42 28.43 23.01 27.69 23.01 26.8L23.01 20.46L40.21 20.46L40.21 26.8C40.21 27.69 40.8 28.43 41.58 28.54L43.34 28.78L44.24 21.98C44.59 19.33 42.76 17.83 40.37 17.83Z" fill="#5A4650" fill-opacity="1.000000" fill-rule="nonzero"/>
                                    <path id="Vector" d="M19.88 57.28L19.88 65.17L17.53 65.17L17.53 59.91C17.53 58.46 18.58 57.28 19.88 57.28ZM43.34 57.28L43.34 65.17L45.68 65.17L45.68 59.91C45.68 58.46 44.63 57.28 43.34 57.28Z" fill="#DC4655" fill-opacity="1.000000" fill-rule="nonzero"/>
                                    <path id="Vector" d="M19.88 65.17L23.01 65.17L23.01 48.67L19.88 49.7L19.88 65.17ZM43.34 65.17L40.21 65.17L40.21 48.67L43.34 49.7L43.34 65.17Z" fill="#FFE17D" fill-opacity="1.000000" fill-rule="nonzero"/>
                                    <path id="Vector" d="M41.77 10.82C41.77 10.82 40.21 12.57 36.3 12.57L29.26 12.57C25.81 12.57 23.01 15.71 23.01 19.58L23.01 20.46L37.86 20.46C40.99 20.46 44.12 16.95 41.77 10.82Z" fill="#64505A" fill-opacity="1.000000" fill-rule="nonzero"/>
                                    <path id="Vector" d="M41.77 10.82C41.77 10.82 40.21 12.57 36.3 12.57L29.26 12.57C28.82 12.57 28.39 12.62 27.97 12.72C27.78 13.35 27.66 14.02 27.66 14.72L27.66 14.75C27.67 15.99 28.65 16.95 29.76 16.95L42.27 16.95C42.77 15.38 42.73 13.32 41.77 10.82Z" fill="#6E5A64" fill-opacity="1.000000" fill-rule="nonzero"/>
                                    <path id="Vector" d="M47.21 50.13L40.8 48.01L39.67 45.46C39.57 45.26 39.45 45.07 39.29 44.93C39.14 44.78 38.95 44.67 38.76 44.6C38.45 44.49 38.12 44.5 37.81 44.62L37.81 41.89C40.25 39.99 41.97 37 42.4 33.55L42.84 33.55C44.26 33.55 45.48 32.37 45.62 30.85C45.7 30 45.45 29.15 44.94 28.52C44.72 28.25 44.45 28.02 44.15 27.85L45.02 22.05C45.3 20.11 44.42 18.26 42.9 17.44C43.59 15.49 43.43 13.08 42.45 10.49C42.4 10.37 42.33 10.26 42.23 10.18C42.14 10.09 42.03 10.04 41.91 10.01C41.8 9.98 41.67 9.99 41.56 10.03C41.45 10.07 41.34 10.14 41.26 10.24C41.24 10.25 39.81 11.75 36.3 11.75L29.26 11.75C26.21 11.75 23.62 13.95 22.66 17.01L22.01 17.01C21.45 17.01 20.89 17.15 20.38 17.41C19.87 17.67 19.42 18.06 19.06 18.54C18.7 19.02 18.43 19.58 18.28 20.19C18.14 20.79 18.11 21.43 18.2 22.05L19.07 27.89C18.27 28.35 17.69 29.22 17.6 30.23C17.52 31.08 17.77 31.93 18.28 32.56C18.53 32.88 18.84 33.12 19.18 33.3C19.52 33.47 19.89 33.55 20.27 33.55L20.81 33.55C21.24 37 22.96 39.99 25.4 41.9L25.4 44.62C25.1 44.5 24.77 44.49 24.46 44.6C24.26 44.67 24.08 44.78 23.93 44.93C23.77 45.07 23.64 45.26 23.55 45.46L22.41 48.01L16 50.13C13.71 50.88 12.11 53.28 12.11 55.96L12.11 65.17C12.11 65.39 12.19 65.6 12.32 65.75C12.46 65.91 12.65 66 12.84 66C13.03 66 13.22 65.91 13.36 65.75C13.49 65.6 13.57 65.39 13.57 65.17L13.57 55.96C13.57 54 14.74 52.25 16.41 51.7L19.15 50.8L19.15 65.17C19.15 65.39 19.22 65.6 19.36 65.75C19.5 65.91 19.68 66 19.88 66C20.07 66 20.26 65.91 20.4 65.75C20.53 65.6 20.61 65.39 20.61 65.17L20.61 50.32L22.27 49.77L22.27 65.17C22.27 65.39 22.35 65.6 22.49 65.75C22.63 65.91 22.81 65.99 23.01 65.99C23.2 65.99 23.39 65.91 23.52 65.75C23.66 65.6 23.74 65.39 23.74 65.17L23.74 50.3L26.78 53.22C27.2 53.62 27.72 53.84 28.26 53.84C28.34 53.84 28.41 53.84 28.48 53.83C29.11 53.76 29.67 53.42 30.06 52.87L31.61 50.71L33.15 52.87C33.55 53.42 34.11 53.76 34.73 53.83C34.81 53.84 34.88 53.84 34.95 53.84C35.5 53.84 36.02 53.62 36.44 53.22L40.26 49.54L42.61 50.32L42.61 65.17C42.61 65.39 42.68 65.6 42.82 65.75C42.96 65.91 43.14 66 43.34 66C43.53 66 43.72 65.91 43.86 65.75C43.99 65.6 44.07 65.39 44.07 65.17L44.07 50.8L46.8 51.7C48.48 52.25 49.64 54 49.64 55.96L49.64 65.17C49.64 65.39 49.72 65.6 49.86 65.75C50 65.91 50.18 65.99 50.38 65.99C50.57 65.99 50.76 65.91 50.89 65.75C51.03 65.6 51.11 65.39 51.11 65.17L51.11 55.96C51.11 53.28 49.51 50.88 47.21 50.13ZM43.57 21.78L42.72 27.53L41.77 27.53C41.32 27.53 40.94 27.11 40.94 26.6L40.94 20.22C41.42 19.85 41.84 19.4 42.19 18.88C43.17 19.37 43.76 20.55 43.57 21.78ZM20.18 19.6C20.4 19.3 20.68 19.06 21 18.9C21.31 18.73 21.66 18.65 22.01 18.65L22.33 18.65C22.29 18.96 22.27 19.27 22.27 19.58L22.27 26.6C22.27 27.11 21.9 27.53 21.44 27.53L20.5 27.53L19.64 21.78C19.58 21.39 19.6 21 19.7 20.62C19.79 20.25 19.95 19.9 20.18 19.6ZM22.17 31.86C22.17 31.64 22.1 31.43 21.96 31.28C21.82 31.12 21.64 31.04 21.44 31.04C21.25 31.04 21.06 31.12 20.92 31.28C20.79 31.43 20.71 31.64 20.71 31.86L20.71 31.91L20.27 31.91C20.1 31.91 19.93 31.87 19.77 31.8C19.62 31.72 19.48 31.6 19.36 31.46C19.13 31.17 19.02 30.79 19.05 30.4C19.11 29.71 19.7 29.17 20.38 29.17L21.44 29.17C22.71 29.17 23.74 28.02 23.74 26.6L23.74 19.58C23.74 16.17 26.22 13.39 29.26 13.39L36.3 13.39C38.87 13.39 40.52 12.66 41.42 12.09C42.08 14.29 41.99 16.25 41.16 17.67C40.43 18.9 39.2 19.64 37.86 19.64L26.13 19.64C25.94 19.64 25.75 19.73 25.62 19.88C25.48 20.03 25.4 20.24 25.4 20.46C25.4 20.68 25.48 20.89 25.62 21.04C25.75 21.19 25.94 21.28 26.13 21.28L37.86 21.28C38.42 21.28 38.96 21.19 39.48 21.01L39.48 26.6C39.48 28.02 40.51 29.17 41.77 29.17L42.95 29.17C43.29 29.17 43.62 29.34 43.85 29.62C44.09 29.91 44.2 30.29 44.16 30.69C44.1 31.37 43.52 31.91 42.84 31.91L42.51 31.91L42.51 31.87C42.51 31.65 42.43 31.44 42.29 31.29C42.15 31.13 41.97 31.05 41.77 31.05L41.77 31.05C41.58 31.05 41.39 31.13 41.26 31.29C41.12 31.44 41.04 31.65 41.04 31.87C41.04 37.69 36.81 42.44 31.61 42.44C26.41 42.44 22.17 37.69 22.17 31.86ZM31.61 44.08C33.31 44.08 34.92 43.64 36.35 42.86L36.35 45.5L31.61 48.45L26.87 45.5L26.87 42.86C28.3 43.64 29.91 44.08 31.61 44.08ZM28.92 51.85C28.85 51.95 28.76 52.03 28.66 52.09C28.57 52.15 28.46 52.18 28.35 52.19C28.24 52.21 28.12 52.19 28.02 52.15C27.91 52.12 27.81 52.06 27.73 51.97L23.92 48.31L24.86 46.2C24.86 46.19 24.87 46.18 24.87 46.18C24.88 46.17 24.88 46.17 24.89 46.17C24.91 46.16 24.92 46.17 24.93 46.17L30.5 49.64L28.92 51.85ZM35.49 51.97C35.4 52.06 35.31 52.12 35.2 52.15C35.09 52.19 34.98 52.21 34.87 52.19C34.76 52.18 34.65 52.15 34.55 52.09C34.45 52.03 34.37 51.95 34.3 51.85L32.72 49.64L38.29 46.17C38.29 46.17 38.31 46.16 38.33 46.17C38.35 46.17 38.35 46.19 38.36 46.19L39.3 48.31L35.49 51.97Z" fill="#000000" fill-opacity="1.000000" fill-rule="nonzero"/>
                                    <path id="Vector" d="M40.21 52.08C40.02 52.08 39.83 52.17 39.69 52.32C39.56 52.47 39.48 52.68 39.48 52.9L39.48 65.17C39.48 65.39 39.56 65.6 39.69 65.75C39.83 65.91 40.02 66 40.21 66C40.4 66 40.59 65.91 40.73 65.75C40.86 65.6 40.94 65.39 40.94 65.17L40.94 52.9C40.94 52.68 40.86 52.47 40.73 52.32C40.59 52.17 40.4 52.08 40.21 52.08ZM31.62 53.83L31.61 53.83C31.2 53.83 30.88 54.2 30.88 54.65C30.88 55.11 31.21 55.47 31.62 55.47C31.81 55.47 32 55.39 32.13 55.23C32.27 55.08 32.35 54.87 32.35 54.65C32.35 54.44 32.27 54.23 32.13 54.07C32 53.92 31.81 53.83 31.62 53.83ZM31.62 64.35L31.61 64.35C31.2 64.35 30.88 64.72 30.88 65.17C30.88 65.63 31.21 66 31.62 66C31.81 66 32 65.91 32.13 65.75C32.27 65.6 32.35 65.39 32.35 65.17C32.35 64.96 32.27 64.75 32.13 64.59C32 64.44 31.81 64.35 31.62 64.35ZM31.62 59.09L31.61 59.09C31.2 59.09 30.88 59.46 30.88 59.91C30.88 60.37 31.21 60.73 31.62 60.73C31.81 60.73 32 60.65 32.13 60.49C32.27 60.34 32.35 60.13 32.35 59.91C32.35 59.7 32.27 59.49 32.13 59.33C32 59.18 31.81 59.09 31.62 59.09ZM27.65 30.18L27.65 29.3C27.65 29.09 27.57 28.88 27.43 28.72C27.3 28.57 27.11 28.48 26.92 28.48C26.72 28.48 26.54 28.57 26.4 28.72C26.26 28.88 26.18 29.09 26.18 29.3L26.18 30.18C26.18 30.4 26.26 30.61 26.4 30.76C26.54 30.91 26.72 31 26.92 31C27.11 31 27.3 30.91 27.43 30.76C27.57 30.61 27.65 30.4 27.65 30.18ZM36.3 28.48C36.11 28.48 35.92 28.57 35.78 28.72C35.65 28.88 35.57 29.09 35.57 29.3L35.57 30.18C35.57 30.4 35.65 30.61 35.78 30.76C35.92 30.91 36.11 31 36.3 31C36.49 31 36.68 30.91 36.82 30.76C36.95 30.61 37.03 30.4 37.03 30.18L37.03 29.3C37.03 29.09 36.95 28.88 36.82 28.72C36.68 28.57 36.49 28.48 36.3 28.48ZM28.43 26.6C28.43 26.38 28.35 26.17 28.22 26.02C28.08 25.86 27.89 25.78 27.7 25.78L26.13 25.78C25.94 25.78 25.75 25.86 25.62 26.02C25.48 26.17 25.4 26.38 25.4 26.6C25.4 26.81 25.48 27.02 25.62 27.18C25.75 27.33 25.94 27.42 26.13 27.42L27.7 27.42C27.89 27.42 28.08 27.33 28.22 27.18C28.35 27.02 28.43 26.81 28.43 26.6ZM35.52 27.42L37.08 27.42C37.28 27.42 37.46 27.33 37.6 27.18C37.74 27.02 37.81 26.81 37.81 26.6C37.81 26.38 37.74 26.17 37.6 26.02C37.46 25.86 37.28 25.78 37.08 25.78L35.52 25.78C35.32 25.78 35.14 25.86 35 26.02C34.86 26.17 34.79 26.38 34.79 26.6C34.79 26.81 34.86 27.02 35 27.18C35.14 27.33 35.32 27.42 35.52 27.42ZM35.86 34.12C35.86 33.91 35.78 33.7 35.64 33.54C35.51 33.39 35.32 33.3 35.13 33.3L28.09 33.3C27.89 33.3 27.71 33.39 27.57 33.54C27.43 33.7 27.36 33.91 27.36 34.12C27.36 36.51 29.26 38.45 31.61 38.45C33.95 38.45 35.86 36.51 35.86 34.12ZM28.95 34.94L34.26 34.94C33.9 36.02 32.85 36.81 31.61 36.81C30.37 36.81 29.31 36.02 28.95 34.94Z" fill="#000000" fill-opacity="1.000000" fill-rule="nonzero"/>
                                </g>
                            </svg>
                            <span class="ml-[10px] text-white font-jakarta text-2xl font-semibold">
                                {driverName}
                            </span>
                            <div class="ml-[33px] flex flex-col text-yellow-app text-xl font-medium items-end">
                                <span>on the road</span>
                                <span class="text-white text-[15px]">Wait time: <span class="text-yellow-app text-xl">2 min.</span></span>
                            </div>                            
                        </div>
                        <div class="rounded-md border-yellow-app border-[1px] p-2">
                            <span class="text-xl text-white font-jakarta font-semibold">
                                Destination:
                            </span>
                            <span class="ml-2 text-yellow-app font-semibold text-xl">
                                {trip.destination}
                            </span>
                        </div>
                        <button on:click={() => {handleTripState(4)}}>demo</button>
                    </div>
                </div>
            </div>
            <Navbar activePage={Pages.Trip}/>
        </div>
        {:else} 
            <div>
                Not loaded yet...
            </div>
        {/if}
        {:else if state === 4}
        {#if trip}
         <!--Driver onGoing  -->
        <div id="page-background">
            <div id="main-container-col">
                <div class="flex flex-row items-center gap-[18.6vw]">
                    <a href="/home">
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-arrow-left" width="48" height="48" viewBox="0 0 24 24" stroke-width="2" stroke="#FFD241" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M5 12l14 0" />
                            <path d="M5 12l6 6" />
                            <path d="M5 12l6 -6" />
                        </svg>
                    </a>
                    <span class="text-3xl text-white font-semibold">
                        Your trip
                    </span>
                </div>
                <div class="mt-[6vw] flex flex-col items-center">
                    <div class="w-[380px] h-[100px] flex flex-col bg-yellow-app p-4 gap-2 rounded-md">
                        <span class="text-lg font-semibold">Your location:</span>
                        <span class="text-[26px] leading-[33px] font-semibold">{trip.startAddress}</span>
                        <button class="absolute right-12 mt-3">
                            <svg width="31.000000" height="31.000000" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                <desc>
                                        Created with Pixso.
                                </desc>
                                <defs/>
                                <path id="Vector" d="M28.5 16.11C28.27 16.08 28.03 16.09 27.8 16.14C27.58 16.19 27.36 16.29 27.18 16.42C26.99 16.56 26.83 16.73 26.71 16.92C26.59 17.11 26.52 17.33 26.48 17.55C26.12 19.89 24.98 22.06 23.23 23.72C21.06 25.8 18.13 26.97 15.07 26.97C12 26.97 9.07 25.8 6.9 23.72C4.74 21.64 3.52 18.82 3.52 15.88C3.52 12.94 4.74 10.12 6.9 8.04C8.59 6.42 10.77 5.34 13.12 4.97C14.21 4.78 15.31 4.75 16.41 4.88C17.95 5.06 19.44 5.54 20.79 6.29L18.48 6.67C18.24 6.7 18.02 6.78 17.82 6.9C17.62 7.02 17.44 7.18 17.31 7.36C17.17 7.54 17.07 7.75 17.02 7.97C16.97 8.19 16.96 8.42 17 8.64C17.04 8.87 17.12 9.08 17.25 9.27C17.38 9.46 17.54 9.63 17.73 9.76C17.93 9.88 18.15 9.98 18.38 10.02C18.61 10.07 18.84 10.07 19.08 10.03L25.28 9.02C25.74 8.94 26.15 8.69 26.43 8.32C26.7 7.95 26.81 7.49 26.73 7.05L25.67 1.09C25.63 0.86 25.56 0.65 25.43 0.45C25.31 0.25 25.15 0.08 24.96 -0.05C24.76 -0.19 24.55 -0.29 24.31 -0.34C24.08 -0.39 23.84 -0.4 23.61 -0.36C23.37 -0.32 23.15 -0.24 22.95 -0.11C22.74 0.01 22.57 0.17 22.44 0.36C22.3 0.55 22.21 0.76 22.16 0.99C22.12 1.21 22.12 1.44 22.17 1.67L22.44 3.24C20.71 2.3 18.79 1.7 16.81 1.49C15.37 1.32 13.92 1.36 12.5 1.61C9.42 2.1 6.59 3.51 4.39 5.63C-1.5 11.28 -1.5 20.48 4.39 26.14C5.79 27.48 7.45 28.55 9.29 29.28C11.12 30.01 13.08 30.38 15.07 30.38C17.05 30.38 19.01 30.01 20.85 29.28C22.68 28.55 24.34 27.48 25.74 26.14C28.04 23.95 29.53 21.11 30 18.05C30.07 17.6 29.95 17.14 29.67 16.78C29.39 16.42 28.97 16.18 28.5 16.11L28.5 16.11Z" fill="#000000" fill-opacity="1.000000" fill-rule="nonzero"/>
                            </svg>
                        </button>
                    </div>
                    <div class="flex flex-col pt-4 px-[26px] w-screen h-[242px] mt-[2vh] border-solid border-yellow-app border-t-2 border-b-2">
                    <span class="text-white text-xl font-semibold">Destination:<span class="ml-2 text-yellow-app text-[22px]">{trip.destination}</span></span>
                    <div class="flex mt-4 flex-col items-center w-full">
                        <span class="text-white text-2xl font-semibold">Your driver</span>
                        <div class="w-full flex mt-2 flex-row text-white font-semibold text-xl items-center justify-between">
                            <div class="flex items-center gap-4">
                                <svg width="120.000000" height="120.000000" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                    <desc>
                                            Created with Pixso.
                                    </desc>
                                    <defs/>
                                    <circle id="Ellipse 1" cx="32.000000" cy="32.000000" r="32.000000" fill="#FFD241" fill-opacity="1.000000"/>
                                    <mask id="mask59_6488" mask-type="alpha" maskUnits="userSpaceOnUse" x="0.000000" y="0.000000" width="64.000000" height="64.000000">
                                        <circle id="Ellipse 2" cx="32.000000" cy="32.000000" r="32.000000" fill="#E65C5C" fill-opacity="1.000000"/>
                                    </mask>
                                    <g mask="url(#mask59_6488)">
                                        <path id="Vector" d="M47.01 50.91L38.77 48.19C38.28 48.03 37.85 47.7 37.55 47.25C37.25 46.79 37.08 46.24 37.08 45.67L37.08 41.5L26.13 41.5L26.13 45.67C26.13 46.24 25.97 46.79 25.67 47.25C25.36 47.7 24.94 48.03 24.45 48.19L16.21 50.91C14.21 51.57 12.84 53.63 12.84 55.96L12.84 65.17L50.38 65.17L50.38 55.96C50.38 53.63 49 51.57 47.01 50.91Z" fill="#E3AA75" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M47.01 50.91L38.77 48.19C38.63 48.15 38.5 48.09 38.37 48.01L31.61 49.39L24.85 48.01C24.72 48.09 24.59 48.15 24.45 48.19L16.21 50.91C14.21 51.57 12.84 53.63 12.84 55.96L12.84 65.17L50.38 65.17L50.38 55.96C50.38 53.63 49.01 51.57 47.01 50.91Z" fill="#E6646E" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M25.72 54.59C26.43 55.27 27.34 55.65 28.27 55.65C29.46 55.65 30.58 55.05 31.32 54L31.61 53.6L31.89 54C32.64 55.05 33.75 55.65 34.95 55.65C35.88 55.65 36.78 55.27 37.49 54.59L41.37 50.87C41.78 50.48 42.08 49.96 42.25 49.37L42.26 49.35L38.77 48.19C38.63 48.15 38.5 48.09 38.37 48.01L31.61 49.39L24.85 48.01C24.72 48.09 24.59 48.15 24.45 48.19L20.96 49.35L20.96 49.37C21.13 49.96 21.44 50.48 21.85 50.87L25.72 54.59Z" fill="#DC4655" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M26.13 44.34C27.78 45.32 29.64 45.89 31.61 45.89C33.58 45.89 35.44 45.32 37.08 44.34L37.08 41.5L26.13 41.5L26.13 44.34Z" fill="#D29B6E" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M42.95 28.35L41.77 28.35L41.77 18.71L21.44 18.71L21.44 28.35L20.27 28.35C19.19 28.35 18.31 29.33 18.31 30.54C18.31 31.75 19.19 32.73 20.27 32.73L21.48 32.73C21.88 38.62 26.26 43.26 31.61 43.26C36.96 43.26 41.33 38.62 41.73 32.73L42.95 32.73C44.03 32.73 44.9 31.75 44.9 30.54C44.9 29.33 44.03 28.35 42.95 28.35Z" fill="#F5B97D" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M21.44 18.71L21.44 28.35L20.27 28.35C19.19 28.35 18.31 29.33 18.31 30.54C18.31 31.75 19.19 32.73 20.27 32.73L21.48 32.73C21.88 38.62 26.26 43.26 31.61 43.26C32.14 43.26 32.66 43.2 33.18 43.11C28.3 42.26 24.57 37.56 24.57 31.86L24.57 26.6C24.57 24.66 25.97 23.09 27.7 23.09L37.08 23.09C37.95 23.09 38.65 22.3 38.65 21.34L38.65 18.71L21.44 18.71Z" fill="#E3AA75" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M31.61 49.39L25.28 45.45C24.89 45.21 24.4 45.38 24.2 45.83L23.22 48.03C23.16 48.17 23.14 48.33 23.17 48.48C23.2 48.63 23.27 48.77 23.38 48.87L27.25 52.6C27.92 53.24 28.94 53.13 29.49 52.36L31.61 49.39Z" fill="#E6646E" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M31.61 49.39L37.93 45.45C38.32 45.21 38.81 45.38 39.01 45.83L39.99 48.03C40.05 48.17 40.07 48.33 40.05 48.48C40.02 48.63 39.95 48.77 39.84 48.87L35.96 52.6C35.29 53.24 34.28 53.13 33.73 52.36L31.61 49.39Z" fill="#E6646E" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M28.09 34.12C28.09 36.06 29.66 37.63 31.61 37.63C33.55 37.63 35.13 36.06 35.13 34.12L28.09 34.12Z" fill="#FFFFFF" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M40.37 17.83L22.85 17.83C20.46 17.83 18.63 19.33 18.98 21.98L19.88 28.78L21.63 28.54C22.42 28.43 23.01 27.69 23.01 26.8L23.01 20.46L40.21 20.46L40.21 26.8C40.21 27.69 40.8 28.43 41.58 28.54L43.34 28.78L44.24 21.98C44.59 19.33 42.76 17.83 40.37 17.83Z" fill="#5A4650" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M19.88 57.28L19.88 65.17L17.53 65.17L17.53 59.91C17.53 58.46 18.58 57.28 19.88 57.28ZM43.34 57.28L43.34 65.17L45.68 65.17L45.68 59.91C45.68 58.46 44.63 57.28 43.34 57.28Z" fill="#DC4655" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M19.88 65.17L23.01 65.17L23.01 48.67L19.88 49.7L19.88 65.17ZM43.34 65.17L40.21 65.17L40.21 48.67L43.34 49.7L43.34 65.17Z" fill="#FFE17D" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M41.77 10.82C41.77 10.82 40.21 12.57 36.3 12.57L29.26 12.57C25.81 12.57 23.01 15.71 23.01 19.58L23.01 20.46L37.86 20.46C40.99 20.46 44.12 16.95 41.77 10.82Z" fill="#64505A" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M41.77 10.82C41.77 10.82 40.21 12.57 36.3 12.57L29.26 12.57C28.82 12.57 28.39 12.62 27.97 12.72C27.78 13.35 27.66 14.02 27.66 14.72L27.66 14.75C27.67 15.99 28.65 16.95 29.76 16.95L42.27 16.95C42.77 15.38 42.73 13.32 41.77 10.82Z" fill="#6E5A64" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M47.21 50.13L40.8 48.01L39.67 45.46C39.57 45.26 39.45 45.07 39.29 44.93C39.14 44.78 38.95 44.67 38.76 44.6C38.45 44.49 38.12 44.5 37.81 44.62L37.81 41.89C40.25 39.99 41.97 37 42.4 33.55L42.84 33.55C44.26 33.55 45.48 32.37 45.62 30.85C45.7 30 45.45 29.15 44.94 28.52C44.72 28.25 44.45 28.02 44.15 27.85L45.02 22.05C45.3 20.11 44.42 18.26 42.9 17.44C43.59 15.49 43.43 13.08 42.45 10.49C42.4 10.37 42.33 10.26 42.23 10.18C42.14 10.09 42.03 10.04 41.91 10.01C41.8 9.98 41.67 9.99 41.56 10.03C41.45 10.07 41.34 10.14 41.26 10.24C41.24 10.25 39.81 11.75 36.3 11.75L29.26 11.75C26.21 11.75 23.62 13.95 22.66 17.01L22.01 17.01C21.45 17.01 20.89 17.15 20.38 17.41C19.87 17.67 19.42 18.06 19.06 18.54C18.7 19.02 18.43 19.58 18.28 20.19C18.14 20.79 18.11 21.43 18.2 22.05L19.07 27.89C18.27 28.35 17.69 29.22 17.6 30.23C17.52 31.08 17.77 31.93 18.28 32.56C18.53 32.88 18.84 33.12 19.18 33.3C19.52 33.47 19.89 33.55 20.27 33.55L20.81 33.55C21.24 37 22.96 39.99 25.4 41.9L25.4 44.62C25.1 44.5 24.77 44.49 24.46 44.6C24.26 44.67 24.08 44.78 23.93 44.93C23.77 45.07 23.64 45.26 23.55 45.46L22.41 48.01L16 50.13C13.71 50.88 12.11 53.28 12.11 55.96L12.11 65.17C12.11 65.39 12.19 65.6 12.32 65.75C12.46 65.91 12.65 66 12.84 66C13.03 66 13.22 65.91 13.36 65.75C13.49 65.6 13.57 65.39 13.57 65.17L13.57 55.96C13.57 54 14.74 52.25 16.41 51.7L19.15 50.8L19.15 65.17C19.15 65.39 19.22 65.6 19.36 65.75C19.5 65.91 19.68 66 19.88 66C20.07 66 20.26 65.91 20.4 65.75C20.53 65.6 20.61 65.39 20.61 65.17L20.61 50.32L22.27 49.77L22.27 65.17C22.27 65.39 22.35 65.6 22.49 65.75C22.63 65.91 22.81 65.99 23.01 65.99C23.2 65.99 23.39 65.91 23.52 65.75C23.66 65.6 23.74 65.39 23.74 65.17L23.74 50.3L26.78 53.22C27.2 53.62 27.72 53.84 28.26 53.84C28.34 53.84 28.41 53.84 28.48 53.83C29.11 53.76 29.67 53.42 30.06 52.87L31.61 50.71L33.15 52.87C33.55 53.42 34.11 53.76 34.73 53.83C34.81 53.84 34.88 53.84 34.95 53.84C35.5 53.84 36.02 53.62 36.44 53.22L40.26 49.54L42.61 50.32L42.61 65.17C42.61 65.39 42.68 65.6 42.82 65.75C42.96 65.91 43.14 66 43.34 66C43.53 66 43.72 65.91 43.86 65.75C43.99 65.6 44.07 65.39 44.07 65.17L44.07 50.8L46.8 51.7C48.48 52.25 49.64 54 49.64 55.96L49.64 65.17C49.64 65.39 49.72 65.6 49.86 65.75C50 65.91 50.18 65.99 50.38 65.99C50.57 65.99 50.76 65.91 50.89 65.75C51.03 65.6 51.11 65.39 51.11 65.17L51.11 55.96C51.11 53.28 49.51 50.88 47.21 50.13ZM43.57 21.78L42.72 27.53L41.77 27.53C41.32 27.53 40.94 27.11 40.94 26.6L40.94 20.22C41.42 19.85 41.84 19.4 42.19 18.88C43.17 19.37 43.76 20.55 43.57 21.78ZM20.18 19.6C20.4 19.3 20.68 19.06 21 18.9C21.31 18.73 21.66 18.65 22.01 18.65L22.33 18.65C22.29 18.96 22.27 19.27 22.27 19.58L22.27 26.6C22.27 27.11 21.9 27.53 21.44 27.53L20.5 27.53L19.64 21.78C19.58 21.39 19.6 21 19.7 20.62C19.79 20.25 19.95 19.9 20.18 19.6ZM22.17 31.86C22.17 31.64 22.1 31.43 21.96 31.28C21.82 31.12 21.64 31.04 21.44 31.04C21.25 31.04 21.06 31.12 20.92 31.28C20.79 31.43 20.71 31.64 20.71 31.86L20.71 31.91L20.27 31.91C20.1 31.91 19.93 31.87 19.77 31.8C19.62 31.72 19.48 31.6 19.36 31.46C19.13 31.17 19.02 30.79 19.05 30.4C19.11 29.71 19.7 29.17 20.38 29.17L21.44 29.17C22.71 29.17 23.74 28.02 23.74 26.6L23.74 19.58C23.74 16.17 26.22 13.39 29.26 13.39L36.3 13.39C38.87 13.39 40.52 12.66 41.42 12.09C42.08 14.29 41.99 16.25 41.16 17.67C40.43 18.9 39.2 19.64 37.86 19.64L26.13 19.64C25.94 19.64 25.75 19.73 25.62 19.88C25.48 20.03 25.4 20.24 25.4 20.46C25.4 20.68 25.48 20.89 25.62 21.04C25.75 21.19 25.94 21.28 26.13 21.28L37.86 21.28C38.42 21.28 38.96 21.19 39.48 21.01L39.48 26.6C39.48 28.02 40.51 29.17 41.77 29.17L42.95 29.17C43.29 29.17 43.62 29.34 43.85 29.62C44.09 29.91 44.2 30.29 44.16 30.69C44.1 31.37 43.52 31.91 42.84 31.91L42.51 31.91L42.51 31.87C42.51 31.65 42.43 31.44 42.29 31.29C42.15 31.13 41.97 31.05 41.77 31.05L41.77 31.05C41.58 31.05 41.39 31.13 41.26 31.29C41.12 31.44 41.04 31.65 41.04 31.87C41.04 37.69 36.81 42.44 31.61 42.44C26.41 42.44 22.17 37.69 22.17 31.86ZM31.61 44.08C33.31 44.08 34.92 43.64 36.35 42.86L36.35 45.5L31.61 48.45L26.87 45.5L26.87 42.86C28.3 43.64 29.91 44.08 31.61 44.08ZM28.92 51.85C28.85 51.95 28.76 52.03 28.66 52.09C28.57 52.15 28.46 52.18 28.35 52.19C28.24 52.21 28.12 52.19 28.02 52.15C27.91 52.12 27.81 52.06 27.73 51.97L23.92 48.31L24.86 46.2C24.86 46.19 24.87 46.18 24.87 46.18C24.88 46.17 24.88 46.17 24.89 46.17C24.91 46.16 24.92 46.17 24.93 46.17L30.5 49.64L28.92 51.85ZM35.49 51.97C35.4 52.06 35.31 52.12 35.2 52.15C35.09 52.19 34.98 52.21 34.87 52.19C34.76 52.18 34.65 52.15 34.55 52.09C34.45 52.03 34.37 51.95 34.3 51.85L32.72 49.64L38.29 46.17C38.29 46.17 38.31 46.16 38.33 46.17C38.35 46.17 38.35 46.19 38.36 46.19L39.3 48.31L35.49 51.97Z" fill="#000000" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M40.21 52.08C40.02 52.08 39.83 52.17 39.69 52.32C39.56 52.47 39.48 52.68 39.48 52.9L39.48 65.17C39.48 65.39 39.56 65.6 39.69 65.75C39.83 65.91 40.02 66 40.21 66C40.4 66 40.59 65.91 40.73 65.75C40.86 65.6 40.94 65.39 40.94 65.17L40.94 52.9C40.94 52.68 40.86 52.47 40.73 52.32C40.59 52.17 40.4 52.08 40.21 52.08ZM31.62 53.83L31.61 53.83C31.2 53.83 30.88 54.2 30.88 54.65C30.88 55.11 31.21 55.47 31.62 55.47C31.81 55.47 32 55.39 32.13 55.23C32.27 55.08 32.35 54.87 32.35 54.65C32.35 54.44 32.27 54.23 32.13 54.07C32 53.92 31.81 53.83 31.62 53.83ZM31.62 64.35L31.61 64.35C31.2 64.35 30.88 64.72 30.88 65.17C30.88 65.63 31.21 66 31.62 66C31.81 66 32 65.91 32.13 65.75C32.27 65.6 32.35 65.39 32.35 65.17C32.35 64.96 32.27 64.75 32.13 64.59C32 64.44 31.81 64.35 31.62 64.35ZM31.62 59.09L31.61 59.09C31.2 59.09 30.88 59.46 30.88 59.91C30.88 60.37 31.21 60.73 31.62 60.73C31.81 60.73 32 60.65 32.13 60.49C32.27 60.34 32.35 60.13 32.35 59.91C32.35 59.7 32.27 59.49 32.13 59.33C32 59.18 31.81 59.09 31.62 59.09ZM27.65 30.18L27.65 29.3C27.65 29.09 27.57 28.88 27.43 28.72C27.3 28.57 27.11 28.48 26.92 28.48C26.72 28.48 26.54 28.57 26.4 28.72C26.26 28.88 26.18 29.09 26.18 29.3L26.18 30.18C26.18 30.4 26.26 30.61 26.4 30.76C26.54 30.91 26.72 31 26.92 31C27.11 31 27.3 30.91 27.43 30.76C27.57 30.61 27.65 30.4 27.65 30.18ZM36.3 28.48C36.11 28.48 35.92 28.57 35.78 28.72C35.65 28.88 35.57 29.09 35.57 29.3L35.57 30.18C35.57 30.4 35.65 30.61 35.78 30.76C35.92 30.91 36.11 31 36.3 31C36.49 31 36.68 30.91 36.82 30.76C36.95 30.61 37.03 30.4 37.03 30.18L37.03 29.3C37.03 29.09 36.95 28.88 36.82 28.72C36.68 28.57 36.49 28.48 36.3 28.48ZM28.43 26.6C28.43 26.38 28.35 26.17 28.22 26.02C28.08 25.86 27.89 25.78 27.7 25.78L26.13 25.78C25.94 25.78 25.75 25.86 25.62 26.02C25.48 26.17 25.4 26.38 25.4 26.6C25.4 26.81 25.48 27.02 25.62 27.18C25.75 27.33 25.94 27.42 26.13 27.42L27.7 27.42C27.89 27.42 28.08 27.33 28.22 27.18C28.35 27.02 28.43 26.81 28.43 26.6ZM35.52 27.42L37.08 27.42C37.28 27.42 37.46 27.33 37.6 27.18C37.74 27.02 37.81 26.81 37.81 26.6C37.81 26.38 37.74 26.17 37.6 26.02C37.46 25.86 37.28 25.78 37.08 25.78L35.52 25.78C35.32 25.78 35.14 25.86 35 26.02C34.86 26.17 34.79 26.38 34.79 26.6C34.79 26.81 34.86 27.02 35 27.18C35.14 27.33 35.32 27.42 35.52 27.42ZM35.86 34.12C35.86 33.91 35.78 33.7 35.64 33.54C35.51 33.39 35.32 33.3 35.13 33.3L28.09 33.3C27.89 33.3 27.71 33.39 27.57 33.54C27.43 33.7 27.36 33.91 27.36 34.12C27.36 36.51 29.26 38.45 31.61 38.45C33.95 38.45 35.86 36.51 35.86 34.12ZM28.95 34.94L34.26 34.94C33.9 36.02 32.85 36.81 31.61 36.81C30.37 36.81 29.31 36.02 28.95 34.94Z" fill="#000000" fill-opacity="1.000000" fill-rule="nonzero"/>
                                    </g>
                                </svg>
                                <span class="">{driverName}</span>
                            </div>
                            <div class="flex flex-col items-center">
                                <svg width="75.000000" height="48.000000" viewBox="0 0 75 48" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                    <desc>
                                            Created with Pixso.
                                    </desc>
                                    <defs>
                                        <clipPath id="clip59_1650">
                                            <rect id="Frame" width="75.000000" height="48.000000" fill="white" fill-opacity="0"/>
                                        </clipPath>
                                    </defs>
                                    <rect id="Frame" width="75.000000" height="48.000000" fill="#FFFFFF" fill-opacity="0"/>
                                    <g clip-path="url(#clip59_1650)">
                                        <path id="Vector" d="M37.52 3.95C36.98 3.97 36.45 4.17 36.04 4.54C35.67 4.85 35.39 5.22 35.13 5.62C34.6 6.43 34.14 7.41 33.71 8.4C33.27 9.39 32.85 10.39 32.47 11.18C32.23 11.66 31.95 12.12 31.62 12.54C31.12 12.72 30.6 12.85 30.07 12.92C29.21 13.04 28.12 13.12 27.05 13.23C26.02 13.31 24.99 13.47 23.98 13.71C23.52 13.82 23.07 14.01 22.66 14.25C22.19 14.52 21.83 14.96 21.64 15.47C21.49 16 21.53 16.56 21.75 17.07C21.92 17.51 22.19 17.9 22.49 18.28C23.09 19.03 23.88 19.77 24.68 20.49C25.49 21.21 26.31 21.92 26.94 22.53C27.57 23.14 27.96 23.75 27.97 23.76C27.97 23.76 28.01 24.49 27.85 25.35C27.7 26.22 27.44 27.27 27.2 28.33C26.97 29.39 26.76 30.44 26.72 31.41C26.69 31.9 26.7 32.36 26.82 32.83C26.93 33.37 27.23 33.85 27.66 34.18C28.15 34.54 28.73 34.61 29.21 34.58C29.69 34.54 30.14 34.41 30.59 34.25C31.49 33.9 32.43 33.37 33.36 32.83C34.29 32.29 35.22 31.72 35.99 31.31C36.76 30.9 37.46 30.71 37.47 30.71C37.48 30.71 38.17 30.91 38.95 31.32C39.72 31.73 40.64 32.3 41.57 32.85C42.5 33.4 43.43 33.93 44.34 34.27C44.79 34.45 45.23 34.57 45.72 34.61C46.26 34.67 46.81 34.53 47.26 34.22C47.69 33.89 48 33.41 48.11 32.87C48.23 32.4 48.24 31.94 48.22 31.45C48.14 30.41 47.98 29.38 47.74 28.37C47.52 27.31 47.26 26.26 47.11 25.39C47.02 24.87 46.98 24.33 47 23.8C47 23.79 47.4 23.18 48.03 22.57C48.66 21.97 49.49 21.26 50.29 20.54C51.1 19.83 51.89 19.1 52.5 18.34C52.8 17.96 53.06 17.58 53.25 17.13C53.47 16.63 53.51 16.06 53.35 15.54C53.17 15.02 52.81 14.58 52.34 14.31C51.93 14.07 51.49 13.88 51.03 13.77C50.02 13.52 48.99 13.35 47.96 13.27C46.88 13.16 45.8 13.07 44.94 12.95C44.41 12.88 43.89 12.75 43.39 12.56C43.06 12.14 42.78 11.68 42.55 11.2C42.17 10.41 41.75 9.41 41.32 8.42C40.93 7.45 40.46 6.52 39.92 5.64C39.66 5.23 39.36 4.86 39 4.54C38.59 4.18 38.07 3.97 37.52 3.95ZM12.52 17.08C12.05 17.09 11.61 17.28 11.26 17.59C10.99 17.84 10.76 18.12 10.57 18.43C10.19 19.08 9.86 19.75 9.58 20.44C9.29 21.14 9.01 21.84 8.76 22.38C8.57 22.8 8.33 23.11 8.28 23.19C8.18 23.22 7.82 23.35 7.38 23.42C6.79 23.51 6.04 23.58 5.29 23.67C4.53 23.76 3.78 23.85 3.09 24.05C2.74 24.15 2.4 24.29 2.09 24.49C1.69 24.73 1.39 25.11 1.24 25.55C1.12 26 1.15 26.48 1.35 26.9C1.5 27.26 1.7 27.55 1.93 27.82C2.39 28.38 2.96 28.88 3.53 29.38C4.11 29.88 4.68 30.36 5.12 30.76C5.44 31.07 5.66 31.39 5.74 31.47C5.74 31.58 5.75 31.96 5.68 32.4C5.58 32.99 5.42 33.73 5.27 34.47C5.1 35.2 5 35.94 4.96 36.68C4.93 37.05 4.97 37.42 5.05 37.78C5.15 38.15 5.36 38.6 5.8 38.9C6.23 39.21 6.73 39.26 7.12 39.23C7.48 39.19 7.84 39.1 8.17 38.95C8.84 38.69 9.5 38.3 10.15 37.91C10.79 37.52 11.43 37.11 11.95 36.83C12.33 36.61 12.71 36.49 12.81 36.45C12.91 36.49 13.28 36.59 13.68 36.8C14.21 37.07 14.85 37.46 15.51 37.83C16.17 38.2 16.84 38.57 17.51 38.81C17.85 38.93 18.19 39.03 18.58 39.05C18.97 39.07 19.47 39.01 19.89 38.69C20.25 38.4 20.5 37.99 20.6 37.54C20.67 37.18 20.7 36.81 20.67 36.44C20.6 35.7 20.47 34.96 20.29 34.24C20.11 33.5 19.93 32.78 19.82 32.19C19.73 31.74 19.73 31.35 19.72 31.26L19.72 31.25C19.79 31.16 20.01 30.85 20.32 30.53C20.74 30.11 21.31 29.61 21.87 29.1C22.42 28.59 22.98 28.06 23.42 27.49C23.65 27.21 23.84 26.89 23.97 26.55C24.15 26.12 24.18 25.64 24.04 25.2C23.88 24.76 23.56 24.4 23.16 24.17C22.84 23.99 22.5 23.85 22.14 23.77C21.45 23.59 20.69 23.51 19.94 23.44C19.19 23.38 18.43 23.33 17.84 23.26C17.39 23.2 17.03 23.08 16.93 23.06C16.87 22.96 16.63 22.66 16.43 22.26C16.16 21.73 15.86 21.04 15.55 20.35C15.25 19.67 14.9 19.01 14.5 18.38C14.3 18.07 14.06 17.79 13.78 17.55C13.43 17.25 12.98 17.08 12.52 17.08ZM62.48 17.08C62.01 17.08 61.56 17.25 61.21 17.55C60.93 17.79 60.69 18.07 60.49 18.38C60.09 18.97 59.76 19.66 59.44 20.35C59.13 21.04 58.83 21.73 58.56 22.26C58.36 22.66 58.12 22.96 58.07 23.06C57.97 23.08 57.6 23.2 57.15 23.26C56.56 23.33 55.81 23.38 55.05 23.44C54.31 23.49 53.57 23.6 52.85 23.76C52.49 23.85 52.15 23.98 51.83 24.16C51.43 24.39 51.12 24.76 50.96 25.2C50.82 25.64 50.84 26.12 51.02 26.55C51.15 26.89 51.34 27.21 51.57 27.49C52.02 28.06 52.57 28.59 53.12 29.1C53.69 29.61 54.25 30.11 54.67 30.53C54.98 30.84 55.2 31.17 55.27 31.25C55.26 31.35 55.27 31.74 55.18 32.19C55.07 32.77 54.88 33.5 54.7 34.24C54.53 34.98 54.37 35.72 54.32 36.44C54.29 36.81 54.32 37.18 54.39 37.54C54.48 37.92 54.68 38.37 55.1 38.69C55.48 38.96 55.95 39.09 56.41 39.05C56.77 39.02 57.13 38.94 57.47 38.81C58.15 38.57 58.82 38.2 59.48 37.83C60.14 37.46 60.79 37.07 61.31 36.8C61.71 36.59 62.08 36.49 62.19 36.45C62.29 36.49 62.66 36.61 63.04 36.83C63.56 37.11 64.2 37.52 64.85 37.91C65.49 38.31 66.15 38.69 66.82 38.95C67.15 39.09 67.49 39.19 67.88 39.23C68.27 39.26 68.76 39.21 69.19 38.9C69.57 38.63 69.83 38.23 69.94 37.77C70.02 37.42 70.06 37.05 70.04 36.68C69.99 35.94 69.89 35.2 69.72 34.47C69.57 33.73 69.41 32.99 69.32 32.4C69.25 31.96 69.26 31.58 69.25 31.47C69.33 31.39 69.55 31.07 69.87 30.76C70.3 30.36 70.89 29.88 71.46 29.38C72.04 28.88 72.6 28.38 73.05 27.83C73.3 27.55 73.5 27.24 73.65 26.9C73.8 26.54 73.91 26.06 73.75 25.55C73.59 25.04 73.23 24.7 72.9 24.48C72.59 24.29 72.25 24.15 71.9 24.05C71.18 23.86 70.45 23.74 69.71 23.67C68.95 23.58 68.2 23.51 67.62 23.42C67.17 23.35 66.81 23.22 66.71 23.19C66.66 23.1 66.42 22.79 66.23 22.38C65.98 21.85 65.7 21.14 65.41 20.44C65.14 19.75 64.81 19.08 64.43 18.43C64.24 18.12 64 17.84 63.73 17.59C63.38 17.28 62.94 17.09 62.48 17.08Z" fill="#FFD241" fill-opacity="1.000000" fill-rule="nonzero"/>
                                    </g>
                                </svg>
                                <span class="font-extrabold text-[32px]">
                                    4,99
                                </span>  
                            </div>                        
                        </div>
                    </div>
                    </div>
                    <div class="flex flex-col pt-5 pb-[52px] gap-4">
                        <div class="flex flex-row items-center gap-2">
                            <button>
                                <div class="w-[185px] h-[120px] flex flex-col items-center rounded-md px-[20px] py-[17px] bg-yellow-app">
                                    <svg width="48.000000" height="48.000000" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                        <desc>
                                                Created with Pixso.
                                        </desc>
                                        <defs>
                                            <clipPath id="clip35_1168">
                                                <rect id="chat icon" width="48.000000" height="48.000000" transform="translate(-0.500000 0.000000)" fill="white" fill-opacity="0"/>
                                            </clipPath>
                                        </defs>
                                        <rect id="chat icon" width="48.000000" height="48.000000" transform="translate(-0.500000 0.000000)" fill="#FFFFFF" fill-opacity="0"/>
                                        <g clip-path="url(#clip35_1168)">
                                            <path id="Vector" d="M35.5 2L11.5 2C8.84 2 6.3 3.05 4.43 4.93C2.55 6.8 1.5 9.34 1.5 12L1.5 28C1.5 30.3 2.3 32.53 3.75 34.32C5.21 36.1 7.24 37.33 9.5 37.8L9.5 44C9.49 44.36 9.59 44.71 9.78 45.02C9.97 45.33 10.23 45.59 10.55 45.76C10.87 45.93 11.23 46.01 11.59 45.99C11.95 45.98 12.3 45.86 12.61 45.66L24.1 38L35.5 38C38.15 37.99 40.69 36.94 42.56 35.06C44.44 33.19 45.49 30.65 45.5 28L45.5 12C45.49 9.34 44.44 6.8 42.56 4.93C40.69 3.05 38.15 2 35.5 2ZM31.5 26L15.5 26C14.96 26 14.46 25.78 14.08 25.41C13.71 25.03 13.5 24.53 13.5 24C13.5 23.46 13.71 22.96 14.08 22.58C14.46 22.21 14.96 22 15.5 22L31.5 22C32.03 22 32.53 22.21 32.91 22.58C33.28 22.96 33.5 23.46 33.5 24C33.5 24.53 33.28 25.03 32.91 25.41C32.53 25.78 32.03 26 31.5 26ZM35.5 18L11.5 18C10.96 18 10.46 17.78 10.08 17.41C9.71 17.03 9.5 16.53 9.5 16C9.5 15.46 9.71 14.96 10.08 14.58C10.46 14.21 10.96 14 11.5 14L35.5 14C36.03 14 36.53 14.21 36.91 14.58C37.28 14.96 37.5 15.46 37.5 16C37.5 16.53 37.28 17.03 36.91 17.41C36.53 17.78 36.03 18 35.5 18Z" fill="#000000" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        </g>
                                    </svg>                                                      
                                    <span class="black-label w-full">
                                        Start chat
                                    </span>
                                </div>
                            </button>
                            <button>
                                <div class="w-[185px] h-[120px] flex flex-col items-center rounded-md px-[38px] py-[17px] bg-yellow-app">
                                    <svg width="48.000000" height="48.000000" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                        <desc>
                                                Created with Pixso.
                                        </desc>
                                        <defs>
                                            <clipPath id="clip35_1173">
                                                <rect id="map icon" width="48.000000" height="48.000000" transform="translate(-0.500000 0.000000)" fill="white" fill-opacity="0"/>
                                            </clipPath>
                                        </defs>
                                        <rect id="map icon" width="48.000000" height="48.000000" transform="translate(-0.500000 0.000000)" fill="#FFFFFF" fill-opacity="0"/>
                                        <g clip-path="url(#clip35_1173)">
                                            <path id="Vector" d="M13.03 25.27L11.14 25.27C10.9 25.27 10.66 25.34 10.46 25.48C10.26 25.61 10.1 25.8 10.01 26.02L4.79 38.16L17.18 31.84C15.69 29.78 14.23 27.52 13.03 25.27ZM36.98 26.02C36.89 25.8 36.73 25.61 36.53 25.48C36.33 25.34 36.09 25.27 35.85 25.27L33.96 25.27C31.7 29.52 28.39 33.91 26.29 36.33C24.81 38.02 22.17 38.02 20.7 36.33C20.55 36.15 19.76 35.24 18.67 33.84L16.44 34.98L24.89 43.41L40.89 35.11L36.98 26.02ZM3.27 41.71L2.6 43.28C2.25 44.09 2.84 45 3.73 45L21.86 45C21.98 44.91 21.98 44.92 22.59 44.6L14.13 36.16L3.27 41.71ZM44.39 43.28L41.86 37.39L27.19 45L43.26 45C44.14 45 44.74 44.09 44.39 43.28ZM24.73 14.1C24.73 13.42 24.18 12.86 23.5 12.86C22.81 12.86 22.26 13.42 22.26 14.1C22.26 14.78 22.81 15.33 23.5 15.33C24.18 15.33 24.73 14.78 24.73 14.1Z" fill="#000000" fill-opacity="1.000000" fill-rule="nonzero"/>
                                            <path id="Vector" d="M24.43 34.63C24.84 34.15 34.61 22.85 34.61 15.08C34.61 -0.94 12.38 -1.13 12.38 15.08C12.38 22.85 22.15 34.15 22.56 34.63C23.06 35.19 23.94 35.19 24.43 34.63ZM19.79 14.1C19.79 12.06 21.45 10.4 23.5 10.4C25.54 10.4 27.2 12.06 27.2 14.1C27.2 16.13 25.54 17.79 23.5 17.79C21.45 17.79 19.79 16.13 19.79 14.1Z" fill="#000000" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        </g>
                                    </svg>                                                       
                                    <span class="black-label">
                                        Map
                                    </span>
                                </div>
                            </button>                      
                        </div>
                        <div class="flex flex-row justify-center items-center gap-5 mt-8">
                            <!-- <div class="flex p-[9px] items-center gap-[7px] border-[2px] rounded-md border-yellow-app text-yellow-app font-semibold text-xl">
                                <svg width="24.000000" height="24.000000" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                    <desc>
                                            Created with Pixso.
                                    </desc>
                                    <defs>
                                        <clipPath id="clip59_1645">
                                            <rect id="arrow-left" width="24.000000" height="24.000000" transform="translate(24.000000 -0.500000) rotate(90.000000)" fill="white" fill-opacity="0"/>
                                        </clipPath>
                                    </defs>
                                    <rect id="arrow-left" width="24.000000" height="24.000000" transform="translate(24.000000 -0.500000) rotate(90.000000)" fill="#FFFFFF" fill-opacity="0"/>
                                    <g clip-path="url(#clip59_1645)">
                                        <path id="Vector" d="M5 11.5L12 4.5L19 11.5" stroke="#FFD241" stroke-opacity="1.000000" stroke-width="2.000000" stroke-linejoin="round" stroke-linecap="round"/>
                                        <path id="Vector" d="M12 18.5L12 4.5" stroke="#FFD241" stroke-opacity="1.000000" stroke-width="2.000000" stroke-linejoin="round" stroke-linecap="round"/>
                                    </g>
                                </svg>
                                1,33 km                                
                            </div> -->
                            <span class="text-white font-medium text-xl">
                                Be in 2 minutes
                            </span>
                        </div>
                    </div>
                    <button on:click={() => {handleTripState(5)}}>demo</button>
                </div>
            </div>
            <Navbar activePage={Pages.Trip}/>
        </div>
        {:else} 
            <div>
                Not loaded yet...
            </div>
        {/if}
        {:else if state === 5}
        {#if trip}
         <!--Payment  -->
        <div id="page-background">
            <div id="main-container-col">
                <div class="flex flex-row items-center gap-[18.6vw]">
                    <a href="/home">
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-arrow-left" width="48" height="48" viewBox="0 0 24 24" stroke-width="2" stroke="#FFD241" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M5 12l14 0" />
                            <path d="M5 12l6 6" />
                            <path d="M5 12l6 -6" />
                        </svg>
                    </a>
                    <span class="text-3xl text-white font-semibold">
                        Your trip
                    </span>
                </div>
                <span class="text-white mt-20 font-extrabold text-3xl w-[70%]">
                    Select a payment method
                </span>
                <button class="mt-8 font-bold text-3xl bg-yellow-app px-[104px] py-[28px] rounded-md">
                    Credit Card
                </button>
                <button class="mt-4 font-bold text-3xl text-yellow-app bg-neutral-950 border-2 border-solid border-yellow-app px-[104px] py-[28px] rounded-md text-center">
                    BLIK
                </button>
                <div class="mt-40 flex flex-row font-bold text-3xl h-[95px] bg-yellow-app rounded-md items-center justify-center gap-[68px]">
                    <span class="font-extrabold">Pay</span>
                    <span class="text-5xl">{trip.price.toFixed(2)} ZŁ</span>
                </div>
                <button on:click={() => {handleTripState(6)}}>demo</button>
            </div>
            <Navbar activePage={Pages.Trip}/>
        </div>
        {:else} 
            <div>
                Not loaded yet...
            </div>
        {/if}
        {:else if state === 6}
        {#if trip}
         <!--Driver grade  -->
        <div id="page-background">
            <div id="main-container-col">
                <div class="flex flex-row items-center gap-[18.6vw]">
                    <a href="/home">
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-arrow-left" width="48" height="48" viewBox="0 0 24 24" stroke-width="2" stroke="#FFD241" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M5 12l14 0" />
                            <path d="M5 12l6 6" />
                            <path d="M5 12l6 -6" />
                        </svg>
                    </a>
                    <span class="text-3xl text-white font-semibold">
                        Your trip
                    </span>
                </div>
                <div class="mt-[6vw] flex flex-col items-center">
                    <span class="text-white text-3xl font-extrabold">Rate your driver!</span>
                    <div class="flex flex-col pt-4 px-[26px] w-screen h-[310px] border-solid border-yellow-app border-b-2">
                        <div class="flex mt-4 flex-col items-center w-full">
                            <div class="w-full flex mt-2 flex-row text-white font-semibold text-xl items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <svg width="160.000000" height="160.000000" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                        <desc>
                                                Created with Pixso.
                                        </desc>
                                        <defs/>
                                        <circle id="Ellipse 1" cx="32.000000" cy="32.000000" r="32.000000" fill="#FFD241" fill-opacity="1.000000"/>
                                        <mask id="mask59_6488" mask-type="alpha" maskUnits="userSpaceOnUse" x="0.000000" y="0.000000" width="64.000000" height="64.000000">
                                            <circle id="Ellipse 2" cx="32.000000" cy="32.000000" r="32.000000" fill="#E65C5C" fill-opacity="1.000000"/>
                                        </mask>
                                        <g mask="url(#mask59_6488)">
                                            <path id="Vector" d="M47.01 50.91L38.77 48.19C38.28 48.03 37.85 47.7 37.55 47.25C37.25 46.79 37.08 46.24 37.08 45.67L37.08 41.5L26.13 41.5L26.13 45.67C26.13 46.24 25.97 46.79 25.67 47.25C25.36 47.7 24.94 48.03 24.45 48.19L16.21 50.91C14.21 51.57 12.84 53.63 12.84 55.96L12.84 65.17L50.38 65.17L50.38 55.96C50.38 53.63 49 51.57 47.01 50.91Z" fill="#E3AA75" fill-opacity="1.000000" fill-rule="nonzero"/>
                                            <path id="Vector" d="M47.01 50.91L38.77 48.19C38.63 48.15 38.5 48.09 38.37 48.01L31.61 49.39L24.85 48.01C24.72 48.09 24.59 48.15 24.45 48.19L16.21 50.91C14.21 51.57 12.84 53.63 12.84 55.96L12.84 65.17L50.38 65.17L50.38 55.96C50.38 53.63 49.01 51.57 47.01 50.91Z" fill="#E6646E" fill-opacity="1.000000" fill-rule="nonzero"/>
                                            <path id="Vector" d="M25.72 54.59C26.43 55.27 27.34 55.65 28.27 55.65C29.46 55.65 30.58 55.05 31.32 54L31.61 53.6L31.89 54C32.64 55.05 33.75 55.65 34.95 55.65C35.88 55.65 36.78 55.27 37.49 54.59L41.37 50.87C41.78 50.48 42.08 49.96 42.25 49.37L42.26 49.35L38.77 48.19C38.63 48.15 38.5 48.09 38.37 48.01L31.61 49.39L24.85 48.01C24.72 48.09 24.59 48.15 24.45 48.19L20.96 49.35L20.96 49.37C21.13 49.96 21.44 50.48 21.85 50.87L25.72 54.59Z" fill="#DC4655" fill-opacity="1.000000" fill-rule="nonzero"/>
                                            <path id="Vector" d="M26.13 44.34C27.78 45.32 29.64 45.89 31.61 45.89C33.58 45.89 35.44 45.32 37.08 44.34L37.08 41.5L26.13 41.5L26.13 44.34Z" fill="#D29B6E" fill-opacity="1.000000" fill-rule="nonzero"/>
                                            <path id="Vector" d="M42.95 28.35L41.77 28.35L41.77 18.71L21.44 18.71L21.44 28.35L20.27 28.35C19.19 28.35 18.31 29.33 18.31 30.54C18.31 31.75 19.19 32.73 20.27 32.73L21.48 32.73C21.88 38.62 26.26 43.26 31.61 43.26C36.96 43.26 41.33 38.62 41.73 32.73L42.95 32.73C44.03 32.73 44.9 31.75 44.9 30.54C44.9 29.33 44.03 28.35 42.95 28.35Z" fill="#F5B97D" fill-opacity="1.000000" fill-rule="nonzero"/>
                                            <path id="Vector" d="M21.44 18.71L21.44 28.35L20.27 28.35C19.19 28.35 18.31 29.33 18.31 30.54C18.31 31.75 19.19 32.73 20.27 32.73L21.48 32.73C21.88 38.62 26.26 43.26 31.61 43.26C32.14 43.26 32.66 43.2 33.18 43.11C28.3 42.26 24.57 37.56 24.57 31.86L24.57 26.6C24.57 24.66 25.97 23.09 27.7 23.09L37.08 23.09C37.95 23.09 38.65 22.3 38.65 21.34L38.65 18.71L21.44 18.71Z" fill="#E3AA75" fill-opacity="1.000000" fill-rule="nonzero"/>
                                            <path id="Vector" d="M31.61 49.39L25.28 45.45C24.89 45.21 24.4 45.38 24.2 45.83L23.22 48.03C23.16 48.17 23.14 48.33 23.17 48.48C23.2 48.63 23.27 48.77 23.38 48.87L27.25 52.6C27.92 53.24 28.94 53.13 29.49 52.36L31.61 49.39Z" fill="#E6646E" fill-opacity="1.000000" fill-rule="nonzero"/>
                                            <path id="Vector" d="M31.61 49.39L37.93 45.45C38.32 45.21 38.81 45.38 39.01 45.83L39.99 48.03C40.05 48.17 40.07 48.33 40.05 48.48C40.02 48.63 39.95 48.77 39.84 48.87L35.96 52.6C35.29 53.24 34.28 53.13 33.73 52.36L31.61 49.39Z" fill="#E6646E" fill-opacity="1.000000" fill-rule="nonzero"/>
                                            <path id="Vector" d="M28.09 34.12C28.09 36.06 29.66 37.63 31.61 37.63C33.55 37.63 35.13 36.06 35.13 34.12L28.09 34.12Z" fill="#FFFFFF" fill-opacity="1.000000" fill-rule="nonzero"/>
                                            <path id="Vector" d="M40.37 17.83L22.85 17.83C20.46 17.83 18.63 19.33 18.98 21.98L19.88 28.78L21.63 28.54C22.42 28.43 23.01 27.69 23.01 26.8L23.01 20.46L40.21 20.46L40.21 26.8C40.21 27.69 40.8 28.43 41.58 28.54L43.34 28.78L44.24 21.98C44.59 19.33 42.76 17.83 40.37 17.83Z" fill="#5A4650" fill-opacity="1.000000" fill-rule="nonzero"/>
                                            <path id="Vector" d="M19.88 57.28L19.88 65.17L17.53 65.17L17.53 59.91C17.53 58.46 18.58 57.28 19.88 57.28ZM43.34 57.28L43.34 65.17L45.68 65.17L45.68 59.91C45.68 58.46 44.63 57.28 43.34 57.28Z" fill="#DC4655" fill-opacity="1.000000" fill-rule="nonzero"/>
                                            <path id="Vector" d="M19.88 65.17L23.01 65.17L23.01 48.67L19.88 49.7L19.88 65.17ZM43.34 65.17L40.21 65.17L40.21 48.67L43.34 49.7L43.34 65.17Z" fill="#FFE17D" fill-opacity="1.000000" fill-rule="nonzero"/>
                                            <path id="Vector" d="M41.77 10.82C41.77 10.82 40.21 12.57 36.3 12.57L29.26 12.57C25.81 12.57 23.01 15.71 23.01 19.58L23.01 20.46L37.86 20.46C40.99 20.46 44.12 16.95 41.77 10.82Z" fill="#64505A" fill-opacity="1.000000" fill-rule="nonzero"/>
                                            <path id="Vector" d="M41.77 10.82C41.77 10.82 40.21 12.57 36.3 12.57L29.26 12.57C28.82 12.57 28.39 12.62 27.97 12.72C27.78 13.35 27.66 14.02 27.66 14.72L27.66 14.75C27.67 15.99 28.65 16.95 29.76 16.95L42.27 16.95C42.77 15.38 42.73 13.32 41.77 10.82Z" fill="#6E5A64" fill-opacity="1.000000" fill-rule="nonzero"/>
                                            <path id="Vector" d="M47.21 50.13L40.8 48.01L39.67 45.46C39.57 45.26 39.45 45.07 39.29 44.93C39.14 44.78 38.95 44.67 38.76 44.6C38.45 44.49 38.12 44.5 37.81 44.62L37.81 41.89C40.25 39.99 41.97 37 42.4 33.55L42.84 33.55C44.26 33.55 45.48 32.37 45.62 30.85C45.7 30 45.45 29.15 44.94 28.52C44.72 28.25 44.45 28.02 44.15 27.85L45.02 22.05C45.3 20.11 44.42 18.26 42.9 17.44C43.59 15.49 43.43 13.08 42.45 10.49C42.4 10.37 42.33 10.26 42.23 10.18C42.14 10.09 42.03 10.04 41.91 10.01C41.8 9.98 41.67 9.99 41.56 10.03C41.45 10.07 41.34 10.14 41.26 10.24C41.24 10.25 39.81 11.75 36.3 11.75L29.26 11.75C26.21 11.75 23.62 13.95 22.66 17.01L22.01 17.01C21.45 17.01 20.89 17.15 20.38 17.41C19.87 17.67 19.42 18.06 19.06 18.54C18.7 19.02 18.43 19.58 18.28 20.19C18.14 20.79 18.11 21.43 18.2 22.05L19.07 27.89C18.27 28.35 17.69 29.22 17.6 30.23C17.52 31.08 17.77 31.93 18.28 32.56C18.53 32.88 18.84 33.12 19.18 33.3C19.52 33.47 19.89 33.55 20.27 33.55L20.81 33.55C21.24 37 22.96 39.99 25.4 41.9L25.4 44.62C25.1 44.5 24.77 44.49 24.46 44.6C24.26 44.67 24.08 44.78 23.93 44.93C23.77 45.07 23.64 45.26 23.55 45.46L22.41 48.01L16 50.13C13.71 50.88 12.11 53.28 12.11 55.96L12.11 65.17C12.11 65.39 12.19 65.6 12.32 65.75C12.46 65.91 12.65 66 12.84 66C13.03 66 13.22 65.91 13.36 65.75C13.49 65.6 13.57 65.39 13.57 65.17L13.57 55.96C13.57 54 14.74 52.25 16.41 51.7L19.15 50.8L19.15 65.17C19.15 65.39 19.22 65.6 19.36 65.75C19.5 65.91 19.68 66 19.88 66C20.07 66 20.26 65.91 20.4 65.75C20.53 65.6 20.61 65.39 20.61 65.17L20.61 50.32L22.27 49.77L22.27 65.17C22.27 65.39 22.35 65.6 22.49 65.75C22.63 65.91 22.81 65.99 23.01 65.99C23.2 65.99 23.39 65.91 23.52 65.75C23.66 65.6 23.74 65.39 23.74 65.17L23.74 50.3L26.78 53.22C27.2 53.62 27.72 53.84 28.26 53.84C28.34 53.84 28.41 53.84 28.48 53.83C29.11 53.76 29.67 53.42 30.06 52.87L31.61 50.71L33.15 52.87C33.55 53.42 34.11 53.76 34.73 53.83C34.81 53.84 34.88 53.84 34.95 53.84C35.5 53.84 36.02 53.62 36.44 53.22L40.26 49.54L42.61 50.32L42.61 65.17C42.61 65.39 42.68 65.6 42.82 65.75C42.96 65.91 43.14 66 43.34 66C43.53 66 43.72 65.91 43.86 65.75C43.99 65.6 44.07 65.39 44.07 65.17L44.07 50.8L46.8 51.7C48.48 52.25 49.64 54 49.64 55.96L49.64 65.17C49.64 65.39 49.72 65.6 49.86 65.75C50 65.91 50.18 65.99 50.38 65.99C50.57 65.99 50.76 65.91 50.89 65.75C51.03 65.6 51.11 65.39 51.11 65.17L51.11 55.96C51.11 53.28 49.51 50.88 47.21 50.13ZM43.57 21.78L42.72 27.53L41.77 27.53C41.32 27.53 40.94 27.11 40.94 26.6L40.94 20.22C41.42 19.85 41.84 19.4 42.19 18.88C43.17 19.37 43.76 20.55 43.57 21.78ZM20.18 19.6C20.4 19.3 20.68 19.06 21 18.9C21.31 18.73 21.66 18.65 22.01 18.65L22.33 18.65C22.29 18.96 22.27 19.27 22.27 19.58L22.27 26.6C22.27 27.11 21.9 27.53 21.44 27.53L20.5 27.53L19.64 21.78C19.58 21.39 19.6 21 19.7 20.62C19.79 20.25 19.95 19.9 20.18 19.6ZM22.17 31.86C22.17 31.64 22.1 31.43 21.96 31.28C21.82 31.12 21.64 31.04 21.44 31.04C21.25 31.04 21.06 31.12 20.92 31.28C20.79 31.43 20.71 31.64 20.71 31.86L20.71 31.91L20.27 31.91C20.1 31.91 19.93 31.87 19.77 31.8C19.62 31.72 19.48 31.6 19.36 31.46C19.13 31.17 19.02 30.79 19.05 30.4C19.11 29.71 19.7 29.17 20.38 29.17L21.44 29.17C22.71 29.17 23.74 28.02 23.74 26.6L23.74 19.58C23.74 16.17 26.22 13.39 29.26 13.39L36.3 13.39C38.87 13.39 40.52 12.66 41.42 12.09C42.08 14.29 41.99 16.25 41.16 17.67C40.43 18.9 39.2 19.64 37.86 19.64L26.13 19.64C25.94 19.64 25.75 19.73 25.62 19.88C25.48 20.03 25.4 20.24 25.4 20.46C25.4 20.68 25.48 20.89 25.62 21.04C25.75 21.19 25.94 21.28 26.13 21.28L37.86 21.28C38.42 21.28 38.96 21.19 39.48 21.01L39.48 26.6C39.48 28.02 40.51 29.17 41.77 29.17L42.95 29.17C43.29 29.17 43.62 29.34 43.85 29.62C44.09 29.91 44.2 30.29 44.16 30.69C44.1 31.37 43.52 31.91 42.84 31.91L42.51 31.91L42.51 31.87C42.51 31.65 42.43 31.44 42.29 31.29C42.15 31.13 41.97 31.05 41.77 31.05L41.77 31.05C41.58 31.05 41.39 31.13 41.26 31.29C41.12 31.44 41.04 31.65 41.04 31.87C41.04 37.69 36.81 42.44 31.61 42.44C26.41 42.44 22.17 37.69 22.17 31.86ZM31.61 44.08C33.31 44.08 34.92 43.64 36.35 42.86L36.35 45.5L31.61 48.45L26.87 45.5L26.87 42.86C28.3 43.64 29.91 44.08 31.61 44.08ZM28.92 51.85C28.85 51.95 28.76 52.03 28.66 52.09C28.57 52.15 28.46 52.18 28.35 52.19C28.24 52.21 28.12 52.19 28.02 52.15C27.91 52.12 27.81 52.06 27.73 51.97L23.92 48.31L24.86 46.2C24.86 46.19 24.87 46.18 24.87 46.18C24.88 46.17 24.88 46.17 24.89 46.17C24.91 46.16 24.92 46.17 24.93 46.17L30.5 49.64L28.92 51.85ZM35.49 51.97C35.4 52.06 35.31 52.12 35.2 52.15C35.09 52.19 34.98 52.21 34.87 52.19C34.76 52.18 34.65 52.15 34.55 52.09C34.45 52.03 34.37 51.95 34.3 51.85L32.72 49.64L38.29 46.17C38.29 46.17 38.31 46.16 38.33 46.17C38.35 46.17 38.35 46.19 38.36 46.19L39.3 48.31L35.49 51.97Z" fill="#000000" fill-opacity="1.000000" fill-rule="nonzero"/>
                                            <path id="Vector" d="M40.21 52.08C40.02 52.08 39.83 52.17 39.69 52.32C39.56 52.47 39.48 52.68 39.48 52.9L39.48 65.17C39.48 65.39 39.56 65.6 39.69 65.75C39.83 65.91 40.02 66 40.21 66C40.4 66 40.59 65.91 40.73 65.75C40.86 65.6 40.94 65.39 40.94 65.17L40.94 52.9C40.94 52.68 40.86 52.47 40.73 52.32C40.59 52.17 40.4 52.08 40.21 52.08ZM31.62 53.83L31.61 53.83C31.2 53.83 30.88 54.2 30.88 54.65C30.88 55.11 31.21 55.47 31.62 55.47C31.81 55.47 32 55.39 32.13 55.23C32.27 55.08 32.35 54.87 32.35 54.65C32.35 54.44 32.27 54.23 32.13 54.07C32 53.92 31.81 53.83 31.62 53.83ZM31.62 64.35L31.61 64.35C31.2 64.35 30.88 64.72 30.88 65.17C30.88 65.63 31.21 66 31.62 66C31.81 66 32 65.91 32.13 65.75C32.27 65.6 32.35 65.39 32.35 65.17C32.35 64.96 32.27 64.75 32.13 64.59C32 64.44 31.81 64.35 31.62 64.35ZM31.62 59.09L31.61 59.09C31.2 59.09 30.88 59.46 30.88 59.91C30.88 60.37 31.21 60.73 31.62 60.73C31.81 60.73 32 60.65 32.13 60.49C32.27 60.34 32.35 60.13 32.35 59.91C32.35 59.7 32.27 59.49 32.13 59.33C32 59.18 31.81 59.09 31.62 59.09ZM27.65 30.18L27.65 29.3C27.65 29.09 27.57 28.88 27.43 28.72C27.3 28.57 27.11 28.48 26.92 28.48C26.72 28.48 26.54 28.57 26.4 28.72C26.26 28.88 26.18 29.09 26.18 29.3L26.18 30.18C26.18 30.4 26.26 30.61 26.4 30.76C26.54 30.91 26.72 31 26.92 31C27.11 31 27.3 30.91 27.43 30.76C27.57 30.61 27.65 30.4 27.65 30.18ZM36.3 28.48C36.11 28.48 35.92 28.57 35.78 28.72C35.65 28.88 35.57 29.09 35.57 29.3L35.57 30.18C35.57 30.4 35.65 30.61 35.78 30.76C35.92 30.91 36.11 31 36.3 31C36.49 31 36.68 30.91 36.82 30.76C36.95 30.61 37.03 30.4 37.03 30.18L37.03 29.3C37.03 29.09 36.95 28.88 36.82 28.72C36.68 28.57 36.49 28.48 36.3 28.48ZM28.43 26.6C28.43 26.38 28.35 26.17 28.22 26.02C28.08 25.86 27.89 25.78 27.7 25.78L26.13 25.78C25.94 25.78 25.75 25.86 25.62 26.02C25.48 26.17 25.4 26.38 25.4 26.6C25.4 26.81 25.48 27.02 25.62 27.18C25.75 27.33 25.94 27.42 26.13 27.42L27.7 27.42C27.89 27.42 28.08 27.33 28.22 27.18C28.35 27.02 28.43 26.81 28.43 26.6ZM35.52 27.42L37.08 27.42C37.28 27.42 37.46 27.33 37.6 27.18C37.74 27.02 37.81 26.81 37.81 26.6C37.81 26.38 37.74 26.17 37.6 26.02C37.46 25.86 37.28 25.78 37.08 25.78L35.52 25.78C35.32 25.78 35.14 25.86 35 26.02C34.86 26.17 34.79 26.38 34.79 26.6C34.79 26.81 34.86 27.02 35 27.18C35.14 27.33 35.32 27.42 35.52 27.42ZM35.86 34.12C35.86 33.91 35.78 33.7 35.64 33.54C35.51 33.39 35.32 33.3 35.13 33.3L28.09 33.3C27.89 33.3 27.71 33.39 27.57 33.54C27.43 33.7 27.36 33.91 27.36 34.12C27.36 36.51 29.26 38.45 31.61 38.45C33.95 38.45 35.86 36.51 35.86 34.12ZM28.95 34.94L34.26 34.94C33.9 36.02 32.85 36.81 31.61 36.81C30.37 36.81 29.31 36.02 28.95 34.94Z" fill="#000000" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        </g>
                                    </svg>
                                    <span class="text-2xl">{driverName}</span>
                                </div>
                                <div class="flex flex-col items-center">
                                    <svg width="75.000000" height="48.000000" viewBox="0 0 75 48" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                        <desc>
                                                Created with Pixso.
                                        </desc>
                                        <defs>
                                            <clipPath id="clip59_1650">
                                                <rect id="Frame" width="75.000000" height="48.000000" fill="white" fill-opacity="0"/>
                                            </clipPath>
                                        </defs>
                                        <rect id="Frame" width="75.000000" height="48.000000" fill="#FFFFFF" fill-opacity="0"/>
                                        <g clip-path="url(#clip59_1650)">
                                            <path id="Vector" d="M37.52 3.95C36.98 3.97 36.45 4.17 36.04 4.54C35.67 4.85 35.39 5.22 35.13 5.62C34.6 6.43 34.14 7.41 33.71 8.4C33.27 9.39 32.85 10.39 32.47 11.18C32.23 11.66 31.95 12.12 31.62 12.54C31.12 12.72 30.6 12.85 30.07 12.92C29.21 13.04 28.12 13.12 27.05 13.23C26.02 13.31 24.99 13.47 23.98 13.71C23.52 13.82 23.07 14.01 22.66 14.25C22.19 14.52 21.83 14.96 21.64 15.47C21.49 16 21.53 16.56 21.75 17.07C21.92 17.51 22.19 17.9 22.49 18.28C23.09 19.03 23.88 19.77 24.68 20.49C25.49 21.21 26.31 21.92 26.94 22.53C27.57 23.14 27.96 23.75 27.97 23.76C27.97 23.76 28.01 24.49 27.85 25.35C27.7 26.22 27.44 27.27 27.2 28.33C26.97 29.39 26.76 30.44 26.72 31.41C26.69 31.9 26.7 32.36 26.82 32.83C26.93 33.37 27.23 33.85 27.66 34.18C28.15 34.54 28.73 34.61 29.21 34.58C29.69 34.54 30.14 34.41 30.59 34.25C31.49 33.9 32.43 33.37 33.36 32.83C34.29 32.29 35.22 31.72 35.99 31.31C36.76 30.9 37.46 30.71 37.47 30.71C37.48 30.71 38.17 30.91 38.95 31.32C39.72 31.73 40.64 32.3 41.57 32.85C42.5 33.4 43.43 33.93 44.34 34.27C44.79 34.45 45.23 34.57 45.72 34.61C46.26 34.67 46.81 34.53 47.26 34.22C47.69 33.89 48 33.41 48.11 32.87C48.23 32.4 48.24 31.94 48.22 31.45C48.14 30.41 47.98 29.38 47.74 28.37C47.52 27.31 47.26 26.26 47.11 25.39C47.02 24.87 46.98 24.33 47 23.8C47 23.79 47.4 23.18 48.03 22.57C48.66 21.97 49.49 21.26 50.29 20.54C51.1 19.83 51.89 19.1 52.5 18.34C52.8 17.96 53.06 17.58 53.25 17.13C53.47 16.63 53.51 16.06 53.35 15.54C53.17 15.02 52.81 14.58 52.34 14.31C51.93 14.07 51.49 13.88 51.03 13.77C50.02 13.52 48.99 13.35 47.96 13.27C46.88 13.16 45.8 13.07 44.94 12.95C44.41 12.88 43.89 12.75 43.39 12.56C43.06 12.14 42.78 11.68 42.55 11.2C42.17 10.41 41.75 9.41 41.32 8.42C40.93 7.45 40.46 6.52 39.92 5.64C39.66 5.23 39.36 4.86 39 4.54C38.59 4.18 38.07 3.97 37.52 3.95ZM12.52 17.08C12.05 17.09 11.61 17.28 11.26 17.59C10.99 17.84 10.76 18.12 10.57 18.43C10.19 19.08 9.86 19.75 9.58 20.44C9.29 21.14 9.01 21.84 8.76 22.38C8.57 22.8 8.33 23.11 8.28 23.19C8.18 23.22 7.82 23.35 7.38 23.42C6.79 23.51 6.04 23.58 5.29 23.67C4.53 23.76 3.78 23.85 3.09 24.05C2.74 24.15 2.4 24.29 2.09 24.49C1.69 24.73 1.39 25.11 1.24 25.55C1.12 26 1.15 26.48 1.35 26.9C1.5 27.26 1.7 27.55 1.93 27.82C2.39 28.38 2.96 28.88 3.53 29.38C4.11 29.88 4.68 30.36 5.12 30.76C5.44 31.07 5.66 31.39 5.74 31.47C5.74 31.58 5.75 31.96 5.68 32.4C5.58 32.99 5.42 33.73 5.27 34.47C5.1 35.2 5 35.94 4.96 36.68C4.93 37.05 4.97 37.42 5.05 37.78C5.15 38.15 5.36 38.6 5.8 38.9C6.23 39.21 6.73 39.26 7.12 39.23C7.48 39.19 7.84 39.1 8.17 38.95C8.84 38.69 9.5 38.3 10.15 37.91C10.79 37.52 11.43 37.11 11.95 36.83C12.33 36.61 12.71 36.49 12.81 36.45C12.91 36.49 13.28 36.59 13.68 36.8C14.21 37.07 14.85 37.46 15.51 37.83C16.17 38.2 16.84 38.57 17.51 38.81C17.85 38.93 18.19 39.03 18.58 39.05C18.97 39.07 19.47 39.01 19.89 38.69C20.25 38.4 20.5 37.99 20.6 37.54C20.67 37.18 20.7 36.81 20.67 36.44C20.6 35.7 20.47 34.96 20.29 34.24C20.11 33.5 19.93 32.78 19.82 32.19C19.73 31.74 19.73 31.35 19.72 31.26L19.72 31.25C19.79 31.16 20.01 30.85 20.32 30.53C20.74 30.11 21.31 29.61 21.87 29.1C22.42 28.59 22.98 28.06 23.42 27.49C23.65 27.21 23.84 26.89 23.97 26.55C24.15 26.12 24.18 25.64 24.04 25.2C23.88 24.76 23.56 24.4 23.16 24.17C22.84 23.99 22.5 23.85 22.14 23.77C21.45 23.59 20.69 23.51 19.94 23.44C19.19 23.38 18.43 23.33 17.84 23.26C17.39 23.2 17.03 23.08 16.93 23.06C16.87 22.96 16.63 22.66 16.43 22.26C16.16 21.73 15.86 21.04 15.55 20.35C15.25 19.67 14.9 19.01 14.5 18.38C14.3 18.07 14.06 17.79 13.78 17.55C13.43 17.25 12.98 17.08 12.52 17.08ZM62.48 17.08C62.01 17.08 61.56 17.25 61.21 17.55C60.93 17.79 60.69 18.07 60.49 18.38C60.09 18.97 59.76 19.66 59.44 20.35C59.13 21.04 58.83 21.73 58.56 22.26C58.36 22.66 58.12 22.96 58.07 23.06C57.97 23.08 57.6 23.2 57.15 23.26C56.56 23.33 55.81 23.38 55.05 23.44C54.31 23.49 53.57 23.6 52.85 23.76C52.49 23.85 52.15 23.98 51.83 24.16C51.43 24.39 51.12 24.76 50.96 25.2C50.82 25.64 50.84 26.12 51.02 26.55C51.15 26.89 51.34 27.21 51.57 27.49C52.02 28.06 52.57 28.59 53.12 29.1C53.69 29.61 54.25 30.11 54.67 30.53C54.98 30.84 55.2 31.17 55.27 31.25C55.26 31.35 55.27 31.74 55.18 32.19C55.07 32.77 54.88 33.5 54.7 34.24C54.53 34.98 54.37 35.72 54.32 36.44C54.29 36.81 54.32 37.18 54.39 37.54C54.48 37.92 54.68 38.37 55.1 38.69C55.48 38.96 55.95 39.09 56.41 39.05C56.77 39.02 57.13 38.94 57.47 38.81C58.15 38.57 58.82 38.2 59.48 37.83C60.14 37.46 60.79 37.07 61.31 36.8C61.71 36.59 62.08 36.49 62.19 36.45C62.29 36.49 62.66 36.61 63.04 36.83C63.56 37.11 64.2 37.52 64.85 37.91C65.49 38.31 66.15 38.69 66.82 38.95C67.15 39.09 67.49 39.19 67.88 39.23C68.27 39.26 68.76 39.21 69.19 38.9C69.57 38.63 69.83 38.23 69.94 37.77C70.02 37.42 70.06 37.05 70.04 36.68C69.99 35.94 69.89 35.2 69.72 34.47C69.57 33.73 69.41 32.99 69.32 32.4C69.25 31.96 69.26 31.58 69.25 31.47C69.33 31.39 69.55 31.07 69.87 30.76C70.3 30.36 70.89 29.88 71.46 29.38C72.04 28.88 72.6 28.38 73.05 27.83C73.3 27.55 73.5 27.24 73.65 26.9C73.8 26.54 73.91 26.06 73.75 25.55C73.59 25.04 73.23 24.7 72.9 24.48C72.59 24.29 72.25 24.15 71.9 24.05C71.18 23.86 70.45 23.74 69.71 23.67C68.95 23.58 68.2 23.51 67.62 23.42C67.17 23.35 66.81 23.22 66.71 23.19C66.66 23.1 66.42 22.79 66.23 22.38C65.98 21.85 65.7 21.14 65.41 20.44C65.14 19.75 64.81 19.08 64.43 18.43C64.24 18.12 64 17.84 63.73 17.59C63.38 17.28 62.94 17.09 62.48 17.08Z" fill="#FFD241" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        </g>
                                    </svg>
                                    <span class="font-extrabold text-[32px]">
                                        4,99
                                    </span>  
                                </div>                        
                            </div>
                        </div>
                        <div class="flex flex-row gap-2 justify-center mt-7">
                            <button on:click={() => {handleTripGrade(1)}} on:focus={()=> {}} on:mouseover={() => {
                                handleStarHover(0)
                            }}
                            on:blur={() => {}}
                            on:mouseout={() => {
                                handleBlurStar(0)
                            }}>
                                <svg width="56.000000" height="56.000000" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                    <desc>
                                            Created with Pixso.
                                    </desc>
                                    <defs>
                                        <clipPath id="clip59_1970">
                                            <rect id="star icon" width="56.000000" height="56.000000" fill="white" fill-opacity="0"/>
                                        </clipPath>
                                    </defs>
                                    <rect id="star icon" width="56.000000" height="56.000000" fill="#FFFFFF" fill-opacity="0"/>
                                    <g clip-path="url(#clip59_1970)">
                                        <path id="Vector" d="M54.78 25.48C55.32 24.96 55.7 24.3 55.88 23.57C56.06 22.84 56.03 22.08 55.8 21.37C55.57 20.65 55.14 20.02 54.57 19.53C53.99 19.05 53.3 18.74 52.55 18.63L38.99 16.66C38.71 16.62 38.44 16.51 38.21 16.34C37.97 16.17 37.79 15.95 37.66 15.69L31.6 3.41C31.27 2.73 30.75 2.17 30.12 1.77C29.48 1.37 28.75 1.17 28 1.17C27.25 1.17 26.51 1.37 25.87 1.77C25.24 2.17 24.72 2.73 24.39 3.41L18.33 15.69C18.07 16.22 17.57 16.58 17 16.66L3.44 18.63C2.69 18.74 2 19.05 1.42 19.53C0.85 20.02 0.42 20.65 0.19 21.37C-0.04 22.08 -0.07 22.84 0.11 23.57C0.29 24.3 0.67 24.96 1.21 25.48L11.02 35.05C11.44 35.46 11.63 36.04 11.53 36.62L9.22 50.12C9.11 50.69 9.14 51.28 9.29 51.85C9.44 52.41 9.71 52.93 10.09 53.38C11.29 54.8 13.37 55.23 15.04 54.35L27.17 47.98C27.43 47.85 27.71 47.78 28 47.78C28.28 47.78 28.56 47.85 28.82 47.98L40.95 54.35C41.52 54.66 42.16 54.82 42.82 54.82C44 54.82 45.12 54.29 45.9 53.38C46.28 52.93 46.55 52.41 46.7 51.85C46.85 51.28 46.88 50.69 46.77 50.12L44.46 36.62C44.41 36.33 44.43 36.04 44.52 35.77C44.61 35.5 44.76 35.25 44.97 35.05L54.78 25.48Z" fill={stars[0] === 1 ? '#FFD241' : '#000000'} fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M54.78 25.48C55.32 24.96 55.7 24.3 55.88 23.57C56.06 22.84 56.03 22.08 55.8 21.37C55.57 20.65 55.14 20.02 54.57 19.53C53.99 19.05 53.3 18.74 52.55 18.63L38.99 16.66C38.71 16.62 38.44 16.51 38.21 16.34C37.97 16.17 37.79 15.95 37.66 15.69L31.6 3.41C31.27 2.73 30.75 2.17 30.12 1.77C29.48 1.37 28.75 1.17 28 1.17C27.25 1.17 26.51 1.37 25.87 1.77C25.24 2.17 24.72 2.73 24.39 3.41L18.33 15.69C18.07 16.22 17.57 16.58 17 16.66L3.44 18.63C2.69 18.74 2 19.05 1.42 19.53C0.85 20.02 0.42 20.65 0.19 21.37C-0.04 22.08 -0.07 22.84 0.11 23.57C0.29 24.3 0.67 24.96 1.21 25.48L11.02 35.05C11.44 35.46 11.63 36.04 11.53 36.62L9.22 50.12C9.11 50.69 9.14 51.28 9.29 51.85C9.44 52.41 9.71 52.93 10.09 53.38C11.29 54.8 13.37 55.23 15.04 54.35L27.17 47.98C27.43 47.85 27.71 47.78 28 47.78C28.28 47.78 28.56 47.85 28.82 47.98L40.95 54.35C41.52 54.66 42.16 54.82 42.82 54.82C44 54.82 45.12 54.29 45.9 53.38C46.28 52.93 46.55 52.41 46.7 51.85C46.85 51.28 46.88 50.69 46.77 50.12L44.46 36.62C44.41 36.33 44.43 36.04 44.52 35.77C44.61 35.5 44.76 35.25 44.97 35.05L54.78 25.48ZM54 22.54Q54.01 22.81 53.94 23.09Q53.87 23.35 53.75 23.57Q53.61 23.83 53.38 24.05L43.57 33.61Q43.24 33.94 43 34.32Q42.76 34.71 42.62 35.15Q42.48 35.59 42.44 36.03Q42.41 36.49 42.49 36.96L44.81 50.48Q44.84 50.69 44.84 50.91Q44.83 51.12 44.77 51.33Q44.73 51.48 44.67 51.62Q44.55 51.87 44.37 52.09Q44.04 52.48 43.61 52.66Q43.25 52.82 42.82 52.82Q42.62 52.82 42.43 52.78Q42.15 52.73 41.88 52.58L29.73 46.2Q29.32 45.99 28.89 45.88Q28.45 45.78 28 45.78Q27.65 45.78 27.31 45.84Q26.76 45.94 26.24 46.21L14.11 52.58Q13.41 52.95 12.79 52.84Q12.15 52.72 11.61 52.08Q11.47 51.91 11.37 51.73Q11.28 51.54 11.22 51.33Q11.19 51.22 11.17 51.11Q11.13 50.79 11.19 50.46L13.5 36.96Q13.67 35.99 13.4 35.15Q13.13 34.31 12.42 33.62L2.6 24.05Q2.39 23.85 2.26 23.61Q2.12 23.37 2.05 23.09Q1.99 22.86 1.99 22.63Q1.99 22.31 2.1 21.98Q2.19 21.71 2.34 21.48Q2.49 21.25 2.71 21.06Q2.91 20.9 3.14 20.79Q3.41 20.66 3.72 20.61L17.28 18.64Q18.27 18.5 18.98 17.98Q19.69 17.46 20.12 16.58L26.19 4.29Q26.32 4.03 26.5 3.82Q26.69 3.62 26.93 3.47Q27.13 3.34 27.35 3.27Q27.66 3.17 28 3.17Q28.29 3.17 28.55 3.24Q28.82 3.32 29.06 3.47Q29.29 3.61 29.46 3.79Q29.67 4.01 29.8 4.29L35.86 16.58Q36.07 17 36.36 17.34Q36.65 17.69 37.03 17.96Q37.41 18.23 37.83 18.4Q38.24 18.58 38.71 18.64L52.27 20.61Q52.56 20.65 52.81 20.77Q53.06 20.88 53.28 21.06Q53.46 21.22 53.6 21.4Q53.79 21.66 53.9 21.99Q53.99 22.26 54 22.54Z" fill="#FFD241" fill-opacity="1.000000" fill-rule="evenodd"/>
                                    </g>
                                </svg>                                
                            </button>
                            <button on:click={() => {handleTripGrade(2)}} on:focus={()=> {}} on:mouseover={() => {
                                handleStarHover(1)
                            }}
                            on:blur={() => {}}
                            on:mouseout={() => {
                                handleBlurStar(1)
                            }}>
                                <svg width="56.000000" height="56.000000" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                    <desc>
                                            Created with Pixso.
                                    </desc>
                                    <defs>
                                        <clipPath id="clip59_1970">
                                            <rect id="star icon" width="56.000000" height="56.000000" fill="white" fill-opacity="0"/>
                                        </clipPath>
                                    </defs>
                                    <rect id="star icon" width="56.000000" height="56.000000" fill="#FFFFFF" fill-opacity="0"/>
                                    <g clip-path="url(#clip59_1970)">
                                        <path id="Vector" d="M54.78 25.48C55.32 24.96 55.7 24.3 55.88 23.57C56.06 22.84 56.03 22.08 55.8 21.37C55.57 20.65 55.14 20.02 54.57 19.53C53.99 19.05 53.3 18.74 52.55 18.63L38.99 16.66C38.71 16.62 38.44 16.51 38.21 16.34C37.97 16.17 37.79 15.95 37.66 15.69L31.6 3.41C31.27 2.73 30.75 2.17 30.12 1.77C29.48 1.37 28.75 1.17 28 1.17C27.25 1.17 26.51 1.37 25.87 1.77C25.24 2.17 24.72 2.73 24.39 3.41L18.33 15.69C18.07 16.22 17.57 16.58 17 16.66L3.44 18.63C2.69 18.74 2 19.05 1.42 19.53C0.85 20.02 0.42 20.65 0.19 21.37C-0.04 22.08 -0.07 22.84 0.11 23.57C0.29 24.3 0.67 24.96 1.21 25.48L11.02 35.05C11.44 35.46 11.63 36.04 11.53 36.62L9.22 50.12C9.11 50.69 9.14 51.28 9.29 51.85C9.44 52.41 9.71 52.93 10.09 53.38C11.29 54.8 13.37 55.23 15.04 54.35L27.17 47.98C27.43 47.85 27.71 47.78 28 47.78C28.28 47.78 28.56 47.85 28.82 47.98L40.95 54.35C41.52 54.66 42.16 54.82 42.82 54.82C44 54.82 45.12 54.29 45.9 53.38C46.28 52.93 46.55 52.41 46.7 51.85C46.85 51.28 46.88 50.69 46.77 50.12L44.46 36.62C44.41 36.33 44.43 36.04 44.52 35.77C44.61 35.5 44.76 35.25 44.97 35.05L54.78 25.48Z" fill={stars[1] === 1 ? '#FFD241' : '#000000'} fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M54.78 25.48C55.32 24.96 55.7 24.3 55.88 23.57C56.06 22.84 56.03 22.08 55.8 21.37C55.57 20.65 55.14 20.02 54.57 19.53C53.99 19.05 53.3 18.74 52.55 18.63L38.99 16.66C38.71 16.62 38.44 16.51 38.21 16.34C37.97 16.17 37.79 15.95 37.66 15.69L31.6 3.41C31.27 2.73 30.75 2.17 30.12 1.77C29.48 1.37 28.75 1.17 28 1.17C27.25 1.17 26.51 1.37 25.87 1.77C25.24 2.17 24.72 2.73 24.39 3.41L18.33 15.69C18.07 16.22 17.57 16.58 17 16.66L3.44 18.63C2.69 18.74 2 19.05 1.42 19.53C0.85 20.02 0.42 20.65 0.19 21.37C-0.04 22.08 -0.07 22.84 0.11 23.57C0.29 24.3 0.67 24.96 1.21 25.48L11.02 35.05C11.44 35.46 11.63 36.04 11.53 36.62L9.22 50.12C9.11 50.69 9.14 51.28 9.29 51.85C9.44 52.41 9.71 52.93 10.09 53.38C11.29 54.8 13.37 55.23 15.04 54.35L27.17 47.98C27.43 47.85 27.71 47.78 28 47.78C28.28 47.78 28.56 47.85 28.82 47.98L40.95 54.35C41.52 54.66 42.16 54.82 42.82 54.82C44 54.82 45.12 54.29 45.9 53.38C46.28 52.93 46.55 52.41 46.7 51.85C46.85 51.28 46.88 50.69 46.77 50.12L44.46 36.62C44.41 36.33 44.43 36.04 44.52 35.77C44.61 35.5 44.76 35.25 44.97 35.05L54.78 25.48ZM54 22.54Q54.01 22.81 53.94 23.09Q53.87 23.35 53.75 23.57Q53.61 23.83 53.38 24.05L43.57 33.61Q43.24 33.94 43 34.32Q42.76 34.71 42.62 35.15Q42.48 35.59 42.44 36.03Q42.41 36.49 42.49 36.96L44.81 50.48Q44.84 50.69 44.84 50.91Q44.83 51.12 44.77 51.33Q44.73 51.48 44.67 51.62Q44.55 51.87 44.37 52.09Q44.04 52.48 43.61 52.66Q43.25 52.82 42.82 52.82Q42.62 52.82 42.43 52.78Q42.15 52.73 41.88 52.58L29.73 46.2Q29.32 45.99 28.89 45.88Q28.45 45.78 28 45.78Q27.65 45.78 27.31 45.84Q26.76 45.94 26.24 46.21L14.11 52.58Q13.41 52.95 12.79 52.84Q12.15 52.72 11.61 52.08Q11.47 51.91 11.37 51.73Q11.28 51.54 11.22 51.33Q11.19 51.22 11.17 51.11Q11.13 50.79 11.19 50.46L13.5 36.96Q13.67 35.99 13.4 35.15Q13.13 34.31 12.42 33.62L2.6 24.05Q2.39 23.85 2.26 23.61Q2.12 23.37 2.05 23.09Q1.99 22.86 1.99 22.63Q1.99 22.31 2.1 21.98Q2.19 21.71 2.34 21.48Q2.49 21.25 2.71 21.06Q2.91 20.9 3.14 20.79Q3.41 20.66 3.72 20.61L17.28 18.64Q18.27 18.5 18.98 17.98Q19.69 17.46 20.12 16.58L26.19 4.29Q26.32 4.03 26.5 3.82Q26.69 3.62 26.93 3.47Q27.13 3.34 27.35 3.27Q27.66 3.17 28 3.17Q28.29 3.17 28.55 3.24Q28.82 3.32 29.06 3.47Q29.29 3.61 29.46 3.79Q29.67 4.01 29.8 4.29L35.86 16.58Q36.07 17 36.36 17.34Q36.65 17.69 37.03 17.96Q37.41 18.23 37.83 18.4Q38.24 18.58 38.71 18.64L52.27 20.61Q52.56 20.65 52.81 20.77Q53.06 20.88 53.28 21.06Q53.46 21.22 53.6 21.4Q53.79 21.66 53.9 21.99Q53.99 22.26 54 22.54Z" fill="#FFD241" fill-opacity="1.000000" fill-rule="evenodd"/>
                                    </g>
                                </svg>                                
                            </button>
                            <button on:click={() => {handleTripGrade(3)}} on:focus={()=> {}} on:mouseover={() => {
                                handleStarHover(2)
                            }}
                            on:blur={() => {}}
                            on:mouseout={() => {
                                handleBlurStar(2)
                            }}>
                                <svg width="56.000000" height="56.000000" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                    <desc>
                                            Created with Pixso.
                                    </desc>
                                    <defs>
                                        <clipPath id="clip59_1970">
                                            <rect id="star icon" width="56.000000" height="56.000000" fill="white" fill-opacity="0"/>
                                        </clipPath>
                                    </defs>
                                    <rect id="star icon" width="56.000000" height="56.000000" fill="#FFFFFF" fill-opacity="0"/>
                                    <g clip-path="url(#clip59_1970)">
                                        <path id="Vector" d="M54.78 25.48C55.32 24.96 55.7 24.3 55.88 23.57C56.06 22.84 56.03 22.08 55.8 21.37C55.57 20.65 55.14 20.02 54.57 19.53C53.99 19.05 53.3 18.74 52.55 18.63L38.99 16.66C38.71 16.62 38.44 16.51 38.21 16.34C37.97 16.17 37.79 15.95 37.66 15.69L31.6 3.41C31.27 2.73 30.75 2.17 30.12 1.77C29.48 1.37 28.75 1.17 28 1.17C27.25 1.17 26.51 1.37 25.87 1.77C25.24 2.17 24.72 2.73 24.39 3.41L18.33 15.69C18.07 16.22 17.57 16.58 17 16.66L3.44 18.63C2.69 18.74 2 19.05 1.42 19.53C0.85 20.02 0.42 20.65 0.19 21.37C-0.04 22.08 -0.07 22.84 0.11 23.57C0.29 24.3 0.67 24.96 1.21 25.48L11.02 35.05C11.44 35.46 11.63 36.04 11.53 36.62L9.22 50.12C9.11 50.69 9.14 51.28 9.29 51.85C9.44 52.41 9.71 52.93 10.09 53.38C11.29 54.8 13.37 55.23 15.04 54.35L27.17 47.98C27.43 47.85 27.71 47.78 28 47.78C28.28 47.78 28.56 47.85 28.82 47.98L40.95 54.35C41.52 54.66 42.16 54.82 42.82 54.82C44 54.82 45.12 54.29 45.9 53.38C46.28 52.93 46.55 52.41 46.7 51.85C46.85 51.28 46.88 50.69 46.77 50.12L44.46 36.62C44.41 36.33 44.43 36.04 44.52 35.77C44.61 35.5 44.76 35.25 44.97 35.05L54.78 25.48Z" fill={stars[2] === 1 ? '#FFD241' : '#000000'} fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M54.78 25.48C55.32 24.96 55.7 24.3 55.88 23.57C56.06 22.84 56.03 22.08 55.8 21.37C55.57 20.65 55.14 20.02 54.57 19.53C53.99 19.05 53.3 18.74 52.55 18.63L38.99 16.66C38.71 16.62 38.44 16.51 38.21 16.34C37.97 16.17 37.79 15.95 37.66 15.69L31.6 3.41C31.27 2.73 30.75 2.17 30.12 1.77C29.48 1.37 28.75 1.17 28 1.17C27.25 1.17 26.51 1.37 25.87 1.77C25.24 2.17 24.72 2.73 24.39 3.41L18.33 15.69C18.07 16.22 17.57 16.58 17 16.66L3.44 18.63C2.69 18.74 2 19.05 1.42 19.53C0.85 20.02 0.42 20.65 0.19 21.37C-0.04 22.08 -0.07 22.84 0.11 23.57C0.29 24.3 0.67 24.96 1.21 25.48L11.02 35.05C11.44 35.46 11.63 36.04 11.53 36.62L9.22 50.12C9.11 50.69 9.14 51.28 9.29 51.85C9.44 52.41 9.71 52.93 10.09 53.38C11.29 54.8 13.37 55.23 15.04 54.35L27.17 47.98C27.43 47.85 27.71 47.78 28 47.78C28.28 47.78 28.56 47.85 28.82 47.98L40.95 54.35C41.52 54.66 42.16 54.82 42.82 54.82C44 54.82 45.12 54.29 45.9 53.38C46.28 52.93 46.55 52.41 46.7 51.85C46.85 51.28 46.88 50.69 46.77 50.12L44.46 36.62C44.41 36.33 44.43 36.04 44.52 35.77C44.61 35.5 44.76 35.25 44.97 35.05L54.78 25.48ZM54 22.54Q54.01 22.81 53.94 23.09Q53.87 23.35 53.75 23.57Q53.61 23.83 53.38 24.05L43.57 33.61Q43.24 33.94 43 34.32Q42.76 34.71 42.62 35.15Q42.48 35.59 42.44 36.03Q42.41 36.49 42.49 36.96L44.81 50.48Q44.84 50.69 44.84 50.91Q44.83 51.12 44.77 51.33Q44.73 51.48 44.67 51.62Q44.55 51.87 44.37 52.09Q44.04 52.48 43.61 52.66Q43.25 52.82 42.82 52.82Q42.62 52.82 42.43 52.78Q42.15 52.73 41.88 52.58L29.73 46.2Q29.32 45.99 28.89 45.88Q28.45 45.78 28 45.78Q27.65 45.78 27.31 45.84Q26.76 45.94 26.24 46.21L14.11 52.58Q13.41 52.95 12.79 52.84Q12.15 52.72 11.61 52.08Q11.47 51.91 11.37 51.73Q11.28 51.54 11.22 51.33Q11.19 51.22 11.17 51.11Q11.13 50.79 11.19 50.46L13.5 36.96Q13.67 35.99 13.4 35.15Q13.13 34.31 12.42 33.62L2.6 24.05Q2.39 23.85 2.26 23.61Q2.12 23.37 2.05 23.09Q1.99 22.86 1.99 22.63Q1.99 22.31 2.1 21.98Q2.19 21.71 2.34 21.48Q2.49 21.25 2.71 21.06Q2.91 20.9 3.14 20.79Q3.41 20.66 3.72 20.61L17.28 18.64Q18.27 18.5 18.98 17.98Q19.69 17.46 20.12 16.58L26.19 4.29Q26.32 4.03 26.5 3.82Q26.69 3.62 26.93 3.47Q27.13 3.34 27.35 3.27Q27.66 3.17 28 3.17Q28.29 3.17 28.55 3.24Q28.82 3.32 29.06 3.47Q29.29 3.61 29.46 3.79Q29.67 4.01 29.8 4.29L35.86 16.58Q36.07 17 36.36 17.34Q36.65 17.69 37.03 17.96Q37.41 18.23 37.83 18.4Q38.24 18.58 38.71 18.64L52.27 20.61Q52.56 20.65 52.81 20.77Q53.06 20.88 53.28 21.06Q53.46 21.22 53.6 21.4Q53.79 21.66 53.9 21.99Q53.99 22.26 54 22.54Z" fill="#FFD241" fill-opacity="1.000000" fill-rule="evenodd"/>
                                    </g>
                                </svg>                                
                            </button>
                            <button on:click={() => {handleTripGrade(4)}} on:focus={()=> {}} on:mouseover={() => {
                                handleStarHover(3)
                            }}
                            on:blur={() => {}}
                            on:mouseout={() => {
                                handleBlurStar(3)
                            }}>
                                <svg width="56.000000" height="56.000000" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                    <desc>
                                            Created with Pixso.
                                    </desc>
                                    <defs>
                                        <clipPath id="clip59_1970">
                                            <rect id="star icon" width="56.000000" height="56.000000" fill="white" fill-opacity="0"/>
                                        </clipPath>
                                    </defs>
                                    <rect id="star icon" width="56.000000" height="56.000000" fill="#FFFFFF" fill-opacity="0"/>
                                    <g clip-path="url(#clip59_1970)">
                                        <path id="Vector" d="M54.78 25.48C55.32 24.96 55.7 24.3 55.88 23.57C56.06 22.84 56.03 22.08 55.8 21.37C55.57 20.65 55.14 20.02 54.57 19.53C53.99 19.05 53.3 18.74 52.55 18.63L38.99 16.66C38.71 16.62 38.44 16.51 38.21 16.34C37.97 16.17 37.79 15.95 37.66 15.69L31.6 3.41C31.27 2.73 30.75 2.17 30.12 1.77C29.48 1.37 28.75 1.17 28 1.17C27.25 1.17 26.51 1.37 25.87 1.77C25.24 2.17 24.72 2.73 24.39 3.41L18.33 15.69C18.07 16.22 17.57 16.58 17 16.66L3.44 18.63C2.69 18.74 2 19.05 1.42 19.53C0.85 20.02 0.42 20.65 0.19 21.37C-0.04 22.08 -0.07 22.84 0.11 23.57C0.29 24.3 0.67 24.96 1.21 25.48L11.02 35.05C11.44 35.46 11.63 36.04 11.53 36.62L9.22 50.12C9.11 50.69 9.14 51.28 9.29 51.85C9.44 52.41 9.71 52.93 10.09 53.38C11.29 54.8 13.37 55.23 15.04 54.35L27.17 47.98C27.43 47.85 27.71 47.78 28 47.78C28.28 47.78 28.56 47.85 28.82 47.98L40.95 54.35C41.52 54.66 42.16 54.82 42.82 54.82C44 54.82 45.12 54.29 45.9 53.38C46.28 52.93 46.55 52.41 46.7 51.85C46.85 51.28 46.88 50.69 46.77 50.12L44.46 36.62C44.41 36.33 44.43 36.04 44.52 35.77C44.61 35.5 44.76 35.25 44.97 35.05L54.78 25.48Z" fill={stars[3] === 1 ? '#FFD241' : '#000000'} fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M54.78 25.48C55.32 24.96 55.7 24.3 55.88 23.57C56.06 22.84 56.03 22.08 55.8 21.37C55.57 20.65 55.14 20.02 54.57 19.53C53.99 19.05 53.3 18.74 52.55 18.63L38.99 16.66C38.71 16.62 38.44 16.51 38.21 16.34C37.97 16.17 37.79 15.95 37.66 15.69L31.6 3.41C31.27 2.73 30.75 2.17 30.12 1.77C29.48 1.37 28.75 1.17 28 1.17C27.25 1.17 26.51 1.37 25.87 1.77C25.24 2.17 24.72 2.73 24.39 3.41L18.33 15.69C18.07 16.22 17.57 16.58 17 16.66L3.44 18.63C2.69 18.74 2 19.05 1.42 19.53C0.85 20.02 0.42 20.65 0.19 21.37C-0.04 22.08 -0.07 22.84 0.11 23.57C0.29 24.3 0.67 24.96 1.21 25.48L11.02 35.05C11.44 35.46 11.63 36.04 11.53 36.62L9.22 50.12C9.11 50.69 9.14 51.28 9.29 51.85C9.44 52.41 9.71 52.93 10.09 53.38C11.29 54.8 13.37 55.23 15.04 54.35L27.17 47.98C27.43 47.85 27.71 47.78 28 47.78C28.28 47.78 28.56 47.85 28.82 47.98L40.95 54.35C41.52 54.66 42.16 54.82 42.82 54.82C44 54.82 45.12 54.29 45.9 53.38C46.28 52.93 46.55 52.41 46.7 51.85C46.85 51.28 46.88 50.69 46.77 50.12L44.46 36.62C44.41 36.33 44.43 36.04 44.52 35.77C44.61 35.5 44.76 35.25 44.97 35.05L54.78 25.48ZM54 22.54Q54.01 22.81 53.94 23.09Q53.87 23.35 53.75 23.57Q53.61 23.83 53.38 24.05L43.57 33.61Q43.24 33.94 43 34.32Q42.76 34.71 42.62 35.15Q42.48 35.59 42.44 36.03Q42.41 36.49 42.49 36.96L44.81 50.48Q44.84 50.69 44.84 50.91Q44.83 51.12 44.77 51.33Q44.73 51.48 44.67 51.62Q44.55 51.87 44.37 52.09Q44.04 52.48 43.61 52.66Q43.25 52.82 42.82 52.82Q42.62 52.82 42.43 52.78Q42.15 52.73 41.88 52.58L29.73 46.2Q29.32 45.99 28.89 45.88Q28.45 45.78 28 45.78Q27.65 45.78 27.31 45.84Q26.76 45.94 26.24 46.21L14.11 52.58Q13.41 52.95 12.79 52.84Q12.15 52.72 11.61 52.08Q11.47 51.91 11.37 51.73Q11.28 51.54 11.22 51.33Q11.19 51.22 11.17 51.11Q11.13 50.79 11.19 50.46L13.5 36.96Q13.67 35.99 13.4 35.15Q13.13 34.31 12.42 33.62L2.6 24.05Q2.39 23.85 2.26 23.61Q2.12 23.37 2.05 23.09Q1.99 22.86 1.99 22.63Q1.99 22.31 2.1 21.98Q2.19 21.71 2.34 21.48Q2.49 21.25 2.71 21.06Q2.91 20.9 3.14 20.79Q3.41 20.66 3.72 20.61L17.28 18.64Q18.27 18.5 18.98 17.98Q19.69 17.46 20.12 16.58L26.19 4.29Q26.32 4.03 26.5 3.82Q26.69 3.62 26.93 3.47Q27.13 3.34 27.35 3.27Q27.66 3.17 28 3.17Q28.29 3.17 28.55 3.24Q28.82 3.32 29.06 3.47Q29.29 3.61 29.46 3.79Q29.67 4.01 29.8 4.29L35.86 16.58Q36.07 17 36.36 17.34Q36.65 17.69 37.03 17.96Q37.41 18.23 37.83 18.4Q38.24 18.58 38.71 18.64L52.27 20.61Q52.56 20.65 52.81 20.77Q53.06 20.88 53.28 21.06Q53.46 21.22 53.6 21.4Q53.79 21.66 53.9 21.99Q53.99 22.26 54 22.54Z" fill="#FFD241" fill-opacity="1.000000" fill-rule="evenodd"/>
                                    </g>
                                </svg>                                
                            </button>
                            <button on:click={() => {handleTripGrade(5)}} on:focus={()=> {}} on:mouseover={() => {
                                handleStarHover(4)
                            }}
                            on:blur={() => {}}
                            on:mouseout={() => {
                                handleBlurStar(4)
                            }}>
                                <svg width="56.000000" height="56.000000" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                    <desc>
                                            Created with Pixso.
                                    </desc>
                                    <defs>
                                        <clipPath id="clip59_1970">
                                            <rect id="star icon" width="56.000000" height="56.000000" fill="white" fill-opacity="0"/>
                                        </clipPath>
                                    </defs>
                                    <rect id="star icon" width="56.000000" height="56.000000" fill="#FFFFFF" fill-opacity="0"/>
                                    <g clip-path="url(#clip59_1970)">
                                        <path id="Vector" d="M54.78 25.48C55.32 24.96 55.7 24.3 55.88 23.57C56.06 22.84 56.03 22.08 55.8 21.37C55.57 20.65 55.14 20.02 54.57 19.53C53.99 19.05 53.3 18.74 52.55 18.63L38.99 16.66C38.71 16.62 38.44 16.51 38.21 16.34C37.97 16.17 37.79 15.95 37.66 15.69L31.6 3.41C31.27 2.73 30.75 2.17 30.12 1.77C29.48 1.37 28.75 1.17 28 1.17C27.25 1.17 26.51 1.37 25.87 1.77C25.24 2.17 24.72 2.73 24.39 3.41L18.33 15.69C18.07 16.22 17.57 16.58 17 16.66L3.44 18.63C2.69 18.74 2 19.05 1.42 19.53C0.85 20.02 0.42 20.65 0.19 21.37C-0.04 22.08 -0.07 22.84 0.11 23.57C0.29 24.3 0.67 24.96 1.21 25.48L11.02 35.05C11.44 35.46 11.63 36.04 11.53 36.62L9.22 50.12C9.11 50.69 9.14 51.28 9.29 51.85C9.44 52.41 9.71 52.93 10.09 53.38C11.29 54.8 13.37 55.23 15.04 54.35L27.17 47.98C27.43 47.85 27.71 47.78 28 47.78C28.28 47.78 28.56 47.85 28.82 47.98L40.95 54.35C41.52 54.66 42.16 54.82 42.82 54.82C44 54.82 45.12 54.29 45.9 53.38C46.28 52.93 46.55 52.41 46.7 51.85C46.85 51.28 46.88 50.69 46.77 50.12L44.46 36.62C44.41 36.33 44.43 36.04 44.52 35.77C44.61 35.5 44.76 35.25 44.97 35.05L54.78 25.48Z" fill={stars[4] === 1 ? '#FFD241' : '#000000'} fill-opacity="1.000000" fill-rule="nonzero"/>
                                        <path id="Vector" d="M54.78 25.48C55.32 24.96 55.7 24.3 55.88 23.57C56.06 22.84 56.03 22.08 55.8 21.37C55.57 20.65 55.14 20.02 54.57 19.53C53.99 19.05 53.3 18.74 52.55 18.63L38.99 16.66C38.71 16.62 38.44 16.51 38.21 16.34C37.97 16.17 37.79 15.95 37.66 15.69L31.6 3.41C31.27 2.73 30.75 2.17 30.12 1.77C29.48 1.37 28.75 1.17 28 1.17C27.25 1.17 26.51 1.37 25.87 1.77C25.24 2.17 24.72 2.73 24.39 3.41L18.33 15.69C18.07 16.22 17.57 16.58 17 16.66L3.44 18.63C2.69 18.74 2 19.05 1.42 19.53C0.85 20.02 0.42 20.65 0.19 21.37C-0.04 22.08 -0.07 22.84 0.11 23.57C0.29 24.3 0.67 24.96 1.21 25.48L11.02 35.05C11.44 35.46 11.63 36.04 11.53 36.62L9.22 50.12C9.11 50.69 9.14 51.28 9.29 51.85C9.44 52.41 9.71 52.93 10.09 53.38C11.29 54.8 13.37 55.23 15.04 54.35L27.17 47.98C27.43 47.85 27.71 47.78 28 47.78C28.28 47.78 28.56 47.85 28.82 47.98L40.95 54.35C41.52 54.66 42.16 54.82 42.82 54.82C44 54.82 45.12 54.29 45.9 53.38C46.28 52.93 46.55 52.41 46.7 51.85C46.85 51.28 46.88 50.69 46.77 50.12L44.46 36.62C44.41 36.33 44.43 36.04 44.52 35.77C44.61 35.5 44.76 35.25 44.97 35.05L54.78 25.48ZM54 22.54Q54.01 22.81 53.94 23.09Q53.87 23.35 53.75 23.57Q53.61 23.83 53.38 24.05L43.57 33.61Q43.24 33.94 43 34.32Q42.76 34.71 42.62 35.15Q42.48 35.59 42.44 36.03Q42.41 36.49 42.49 36.96L44.81 50.48Q44.84 50.69 44.84 50.91Q44.83 51.12 44.77 51.33Q44.73 51.48 44.67 51.62Q44.55 51.87 44.37 52.09Q44.04 52.48 43.61 52.66Q43.25 52.82 42.82 52.82Q42.62 52.82 42.43 52.78Q42.15 52.73 41.88 52.58L29.73 46.2Q29.32 45.99 28.89 45.88Q28.45 45.78 28 45.78Q27.65 45.78 27.31 45.84Q26.76 45.94 26.24 46.21L14.11 52.58Q13.41 52.95 12.79 52.84Q12.15 52.72 11.61 52.08Q11.47 51.91 11.37 51.73Q11.28 51.54 11.22 51.33Q11.19 51.22 11.17 51.11Q11.13 50.79 11.19 50.46L13.5 36.96Q13.67 35.99 13.4 35.15Q13.13 34.31 12.42 33.62L2.6 24.05Q2.39 23.85 2.26 23.61Q2.12 23.37 2.05 23.09Q1.99 22.86 1.99 22.63Q1.99 22.31 2.1 21.98Q2.19 21.71 2.34 21.48Q2.49 21.25 2.71 21.06Q2.91 20.9 3.14 20.79Q3.41 20.66 3.72 20.61L17.28 18.64Q18.27 18.5 18.98 17.98Q19.69 17.46 20.12 16.58L26.19 4.29Q26.32 4.03 26.5 3.82Q26.69 3.62 26.93 3.47Q27.13 3.34 27.35 3.27Q27.66 3.17 28 3.17Q28.29 3.17 28.55 3.24Q28.82 3.32 29.06 3.47Q29.29 3.61 29.46 3.79Q29.67 4.01 29.8 4.29L35.86 16.58Q36.07 17 36.36 17.34Q36.65 17.69 37.03 17.96Q37.41 18.23 37.83 18.4Q38.24 18.58 38.71 18.64L52.27 20.61Q52.56 20.65 52.81 20.77Q53.06 20.88 53.28 21.06Q53.46 21.22 53.6 21.4Q53.79 21.66 53.9 21.99Q53.99 22.26 54 22.54Z" fill="#FFD241" fill-opacity="1.000000" fill-rule="evenodd"/>
                                    </g>
                                </svg>                                
                            </button>
                        </div>
                    </div>
                    <div class="flex flex-col pt-5 pb-[52px] gap-4">
                        <div class="flex flex-row items-center gap-2">
                            <button>
                                <div class="w-[185px] h-[120px] flex flex-col items-center rounded-md px-[20px] py-[17px] bg-yellow-app">
                                    <svg width="48.000000" height="48.000000" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                        <desc>
                                                Created with Pixso.
                                        </desc>
                                        <defs>
                                            <clipPath id="clip35_1168">
                                                <rect id="chat icon" width="48.000000" height="48.000000" transform="translate(-0.500000 0.000000)" fill="white" fill-opacity="0"/>
                                            </clipPath>
                                        </defs>
                                        <rect id="chat icon" width="48.000000" height="48.000000" transform="translate(-0.500000 0.000000)" fill="#FFFFFF" fill-opacity="0"/>
                                        <g clip-path="url(#clip35_1168)">
                                            <path id="Vector" d="M35.5 2L11.5 2C8.84 2 6.3 3.05 4.43 4.93C2.55 6.8 1.5 9.34 1.5 12L1.5 28C1.5 30.3 2.3 32.53 3.75 34.32C5.21 36.1 7.24 37.33 9.5 37.8L9.5 44C9.49 44.36 9.59 44.71 9.78 45.02C9.97 45.33 10.23 45.59 10.55 45.76C10.87 45.93 11.23 46.01 11.59 45.99C11.95 45.98 12.3 45.86 12.61 45.66L24.1 38L35.5 38C38.15 37.99 40.69 36.94 42.56 35.06C44.44 33.19 45.49 30.65 45.5 28L45.5 12C45.49 9.34 44.44 6.8 42.56 4.93C40.69 3.05 38.15 2 35.5 2ZM31.5 26L15.5 26C14.96 26 14.46 25.78 14.08 25.41C13.71 25.03 13.5 24.53 13.5 24C13.5 23.46 13.71 22.96 14.08 22.58C14.46 22.21 14.96 22 15.5 22L31.5 22C32.03 22 32.53 22.21 32.91 22.58C33.28 22.96 33.5 23.46 33.5 24C33.5 24.53 33.28 25.03 32.91 25.41C32.53 25.78 32.03 26 31.5 26ZM35.5 18L11.5 18C10.96 18 10.46 17.78 10.08 17.41C9.71 17.03 9.5 16.53 9.5 16C9.5 15.46 9.71 14.96 10.08 14.58C10.46 14.21 10.96 14 11.5 14L35.5 14C36.03 14 36.53 14.21 36.91 14.58C37.28 14.96 37.5 15.46 37.5 16C37.5 16.53 37.28 17.03 36.91 17.41C36.53 17.78 36.03 18 35.5 18Z" fill="#000000" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        </g>
                                    </svg>                                                      
                                    <span class="black-label w-full">
                                        Chat
                                    </span>
                                </div>
                            </button>
                            <button>
                                <div class="w-[185px] h-[120px] flex flex-col items-center rounded-md px-[38px] py-[17px] bg-yellow-app">
                                    <svg width="48.000000" height="48.000000" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                        <desc>
                                                Created with Pixso.
                                        </desc>
                                        <defs>
                                            <clipPath id="clip35_1173">
                                                <rect id="map icon" width="48.000000" height="48.000000" transform="translate(-0.500000 0.000000)" fill="white" fill-opacity="0"/>
                                            </clipPath>
                                        </defs>
                                        <rect id="map icon" width="48.000000" height="48.000000" transform="translate(-0.500000 0.000000)" fill="#FFFFFF" fill-opacity="0"/>
                                        <g clip-path="url(#clip35_1173)">
                                            <path id="Vector" d="M13.03 25.27L11.14 25.27C10.9 25.27 10.66 25.34 10.46 25.48C10.26 25.61 10.1 25.8 10.01 26.02L4.79 38.16L17.18 31.84C15.69 29.78 14.23 27.52 13.03 25.27ZM36.98 26.02C36.89 25.8 36.73 25.61 36.53 25.48C36.33 25.34 36.09 25.27 35.85 25.27L33.96 25.27C31.7 29.52 28.39 33.91 26.29 36.33C24.81 38.02 22.17 38.02 20.7 36.33C20.55 36.15 19.76 35.24 18.67 33.84L16.44 34.98L24.89 43.41L40.89 35.11L36.98 26.02ZM3.27 41.71L2.6 43.28C2.25 44.09 2.84 45 3.73 45L21.86 45C21.98 44.91 21.98 44.92 22.59 44.6L14.13 36.16L3.27 41.71ZM44.39 43.28L41.86 37.39L27.19 45L43.26 45C44.14 45 44.74 44.09 44.39 43.28ZM24.73 14.1C24.73 13.42 24.18 12.86 23.5 12.86C22.81 12.86 22.26 13.42 22.26 14.1C22.26 14.78 22.81 15.33 23.5 15.33C24.18 15.33 24.73 14.78 24.73 14.1Z" fill="#000000" fill-opacity="1.000000" fill-rule="nonzero"/>
                                            <path id="Vector" d="M24.43 34.63C24.84 34.15 34.61 22.85 34.61 15.08C34.61 -0.94 12.38 -1.13 12.38 15.08C12.38 22.85 22.15 34.15 22.56 34.63C23.06 35.19 23.94 35.19 24.43 34.63ZM19.79 14.1C19.79 12.06 21.45 10.4 23.5 10.4C25.54 10.4 27.2 12.06 27.2 14.1C27.2 16.13 25.54 17.79 23.5 17.79C21.45 17.79 19.79 16.13 19.79 14.1Z" fill="#000000" fill-opacity="1.000000" fill-rule="nonzero"/>
                                        </g>
                                    </svg>                                                       
                                    <span class="black-label">
                                        Pay tip
                                    </span>
                                </div>
                            </button>                      
                        </div>
                        <span class="mt-14 red font-medium text-3xl text-center underline hover:cursor-pointer">
                            Report driver
                        </span>
                    </div>
                </div>
            </div>
            <Navbar activePage={Pages.Trip}/>
        </div>
        {:else} 
            <div>
                Not loaded yet...
            </div>
        {/if}
        {/if}
    {:else}
        <div>
            Unauthorized access
        </div>
    {/if}
{:else}
    <div>
        Not loaded yet...
    </div>
{/if}