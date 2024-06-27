<script lang="ts">
    // @ts-nocheck
    import { Pages, type Driver, type Passenger } from "../../ts/types";
    import Map from "../../components/Map.svelte";
    import Navbar from "../../components/Navbar.svelte"
    import { onMount } from "svelte";

    let loading: boolean = true
    let trips = null;
    let user: Passenger | Driver = null;
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
    function formatDateTime(dateString) {
        let dateObj = new Date(dateString);
        let date = dateObj.toISOString().split('T')[0];
        let time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${date} ${time}`;
    }
    async function getTrips() {
        const res = await fetch("/api/trip/getTrips", {
                method: 'POST',
                body: JSON.stringify({userId: user.id})
            })
            if (res.ok) {
                trips = await res.json();
            }
    }
    onMount(async () => {
        await getAuthToken();
        await getTrips();
        loading = false;
    }); 
    </script>
    <style>
        #hr {
            border-bottom: 2px solid rgb(127, 127, 127)
        }
    </style>
    {#if !loading}
    {#if user}
    <div id="page-background"> 
        <div id="main-container-col" class="items-center">
            <div class="flex flex-row justify-center items-center gap-[18.6vw]">
                <a href="/profile">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-arrow-left" width="48" height="48" viewBox="0 0 24 24" stroke-width="2" stroke="#FFD241" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M5 12l14 0" />
                        <path d="M5 12l6 6" />
                        <path d="M5 12l6 -6" />
                    </svg>
                </a>
                <span class="text-3xl text-white font-semibold">
                    Last trips
                </span>
                <svg width="44.000000" height="44.000000" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <desc>
                            Created with Pixso.
                    </desc>
                    <defs>
                        <clipPath id="clip59_2781">
                            <rect id="calendar icon" width="44.000000" height="44.000000" fill="white" fill-opacity="0"/>
                        </clipPath>
                    </defs>
                    <rect id="calendar icon" width="44.000000" height="44.000000" fill="#FFFFFF" fill-opacity="0"/>
                    <g clip-path="url(#clip59_2781)">
                        <path id="Vector" d="M38.3 2.58L34.42 2.58L34.42 6.47C34.42 7.24 33.77 7.76 33.12 7.76C32.48 7.76 31.83 7.24 31.83 6.47L31.83 2.58L11.12 2.58L11.12 6.47C11.12 7.24 10.48 7.76 9.83 7.76C9.18 7.76 8.54 7.24 8.54 6.47L8.54 2.58L4.65 2.58C2.71 2.58 1.29 4.27 1.29 6.47L1.29 11.12L42.7 11.12L42.7 6.47C42.7 4.27 40.37 2.58 38.3 2.58ZM1.29 13.84L1.29 37.52C1.29 39.85 2.71 41.41 4.78 41.41L38.43 41.41C40.5 41.41 42.83 39.72 42.83 37.52L42.83 13.84L1.29 13.84ZM12.81 35.58L9.7 35.58C9.18 35.58 8.67 35.2 8.67 34.55L8.67 31.31C8.67 30.79 9.05 30.28 9.7 30.28L12.94 30.28C13.45 30.28 13.97 30.67 13.97 31.31L13.97 34.55C13.84 35.2 13.45 35.58 12.81 35.58ZM12.81 23.94L9.7 23.94C9.18 23.94 8.67 23.55 8.67 22.9L8.67 19.67C8.67 19.15 9.05 18.63 9.7 18.63L12.94 18.63C13.45 18.63 13.97 19.02 13.97 19.67L13.97 22.9C13.84 23.55 13.45 23.94 12.81 23.94ZM23.16 35.58L19.92 35.58C19.41 35.58 18.89 35.2 18.89 34.55L18.89 31.31C18.89 30.79 19.28 30.28 19.92 30.28L23.16 30.28C23.68 30.28 24.19 30.67 24.19 31.31L24.19 34.55C24.19 35.2 23.81 35.58 23.16 35.58ZM23.16 23.94L19.92 23.94C19.41 23.94 18.89 23.55 18.89 22.9L18.89 19.67C18.89 19.15 19.28 18.63 19.92 18.63L23.16 18.63C23.68 18.63 24.19 19.02 24.19 19.67L24.19 22.9C24.19 23.55 23.81 23.94 23.16 23.94ZM33.51 35.58L30.28 35.58C29.76 35.58 29.24 35.2 29.24 34.55L29.24 31.31C29.24 30.79 29.63 30.28 30.28 30.28L33.51 30.28C34.03 30.28 34.55 30.67 34.55 31.31L34.55 34.55C34.55 35.2 34.16 35.58 33.51 35.58ZM33.51 23.94L30.28 23.94C29.76 23.94 29.24 23.55 29.24 22.9L29.24 19.67C29.24 19.15 29.63 18.63 30.28 18.63L33.51 18.63C34.03 18.63 34.55 19.02 34.55 19.67L34.55 22.9C34.55 23.55 34.16 23.94 33.51 23.94Z" fill="#FFD241" fill-opacity="1.000000" fill-rule="nonzero"/>
                    </g>
                </svg>
            </div>
            <input class="mt-[4.3vh]" placeholder="Find your trip"/>
            <div id="hr" class=" w-[380px] h-[42px] text-2xl text-white font-semibold mt-[3.9vh]">
                Your last trips
                <!-- <hr/> -->
            </div>
            <div class="flex h-[65vh] flex-col gap-3 overflow-y-auto">
                <div class="mt-5"/>
                <!-- Trips go here... -->
                {#each trips as item (item.id)} <!-- trip.id może być unikalnym identyfikatorem dla każdego elementu -->
                    <div class="p-4 w-[380px] h-[190px] flex flex-col items-start bg-yellow-app rounded-md gap-4">
                        <div class="flex flex-row justify-between w-full">
                            <span class="p-1 text-[17px] text-yellow-app font-semibold rounded-md bg-neutral-950 leading-[21px]">
                                {formatDateTime(item.date)}
                            </span>
                            <!-- <span class="p-1 text-[17px] text-yellow-app font-semibold rounded-md bg-neutral-950 leading-[21px]">
                                15 min.
                            </span> -->
                        </div>
                        <div class="flex flex-row gap-3 items-center font-bold text-xl leading-[25px]">
                            {item.startAddress}
                            <svg xmlns="http://www.w3.org/2000/svg" class="rotate-180 icon icon-tabler icon-tabler-arrow-left" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="#000000" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M5 12l14 0" />
                                <path d="M5 12l6 6" />
                                <path d="M5 12l6 -6" />
                            </svg>
                            {item.destination}
                        </div>
                        <span class="p-[7px] bg-neutral-950 text-yellow-app rounded-md text-xl font-semibold leading-[25px]">
                            {item.price.toFixed(2)} ZŁ
                        </span>
                    </div>
                {/each}
                
            </div>
        </div>
        <Navbar activePage={Pages.Profile}/>
    </div>
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
    