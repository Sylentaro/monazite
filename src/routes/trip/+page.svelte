<script lang="ts">
    // @ts-nocheck
    import { Pages, type Driver, type Passenger } from "../../ts/types";
    import Map from "../../components/Map.svelte";
    import Navbar from "../../components/Navbar.svelte"
    import { onMount } from "svelte";

    let loading: boolean = true
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
    onMount(async () => {
        await getAuthToken();
        loading = false;
    }); 
</script>
{#if !loading}
{#if user}
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
                <span class="text-[26px] leading-[33px] font-semibold">Lublin, Prząśniczki 2</span>
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
                <Map/>
            </div>
            <div class="flex flex-col w-[380px] mt-[2.5vh] gap-[1.5vh]">
                <div class="flex flex-row items-center px-4 w-full h-[45px] border-yellow-app border-2 rounded-md text-white font-semibold text-base">
                    Your location: <b class="ml-1 text-xl">Lublin, Prząśniczki 2</b>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="rotate-[-90deg] icon icon-tabler icon-tabler-arrow-left" width="32" height="32" viewBox="0 0 24 24" stroke-width="2" stroke="#FFD241" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M5 12l14 0" />
                    <path d="M5 12l6 6" />
                    <path d="M5 12l6 -6" />
                </svg>
                <div class="flex flex-row items-center px-4 w-full h-[45px] border-yellow-app border-2 rounded-md text-white font-semibold text-base">
                    Your destination: <b class="ml-1 text-xl">Lublin, Prząśniczki 2</b>
                </div>
            </div>
        </div>
        <div class="flex flex-row justify-center mt-[2vh]">
            <button class="w-[175px] h-[57px] bg-yellow-app rounded-md font-extrabold text-xl">
                Accept trip
            </button>
        </div>
    </div>
    <Navbar activePage={Pages.Trip}/>
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
