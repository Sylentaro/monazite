<script lang="ts">
	import { createEventDispatcher } from "svelte";
    import {Pages} from "../ts/types"
    export let activePage: Pages;
    
    const dispatch = createEventDispatcher();
    
    function handleTrip() {
        dispatch('handleTripPage')
    }
    function handleHome() {
        dispatch('handleHomePage')
    }
</script>
<div class="flex h-[8.5vh] bg-neutral-950 w-full fixed bottom-0">
    <div class="flex flex-row w-full items-center justify-between px-[6vw]">
        {#if activePage === Pages.Trip}
        <button on:click={handleHome}>
            <svg width="11vw" height="11vw" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                <desc>
                        Created with Pixso.
                </desc>
                <defs/>
                <path id="Vector" fill={'#7F7F7F'} d="M29.45 14.12L17.12 2.45C16.82 2.16 16.41 2 16 2C15.58 2 15.17 2.16 14.87 2.45L2.54 14.12C2.26 14.39 2.07 14.76 2.01 15.16C1.96 15.56 2.03 15.96 2.23 16.31C2.39 16.57 2.61 16.79 2.87 16.94C3.13 17.09 3.43 17.17 3.72 17.16L5.35 17.16L5.35 28.25C5.35 28.71 5.53 29.15 5.85 29.48C6.16 29.81 6.59 30 7.04 30L10.96 30C11.4 30 11.83 29.81 12.14 29.48C12.46 29.15 12.64 28.71 12.64 28.25L12.64 21.83C12.64 21.36 12.81 20.92 13.13 20.59C13.44 20.26 13.87 20.08 14.31 20.08L17.68 20.08C18.12 20.08 18.55 20.26 18.86 20.59C19.18 20.92 19.35 21.36 19.35 21.83L19.35 28.25C19.35 28.71 19.53 29.15 19.85 29.48C20.16 29.81 20.59 30 21.04 30L24.96 30C25.4 30 25.83 29.81 26.14 29.48C26.46 29.15 26.64 28.71 26.64 28.25L26.64 17.16L28.27 17.16C28.56 17.17 28.86 17.09 29.12 16.94C29.38 16.79 29.6 16.57 29.76 16.31C29.96 15.96 30.03 15.56 29.98 15.16C29.92 14.76 29.73 14.39 29.45 14.12Z" fill-opacity="1.000000" fill-rule="nonzero"/>
            </svg>
        </button>
        {:else if activePage === Pages.Home}
        <button>
            <svg width="11vw" height="11vw" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                <desc>
                        Created with Pixso.
                </desc>
                <defs/>
                <path id="Vector" fill={'#FFD241'} d="M29.45 14.12L17.12 2.45C16.82 2.16 16.41 2 16 2C15.58 2 15.17 2.16 14.87 2.45L2.54 14.12C2.26 14.39 2.07 14.76 2.01 15.16C1.96 15.56 2.03 15.96 2.23 16.31C2.39 16.57 2.61 16.79 2.87 16.94C3.13 17.09 3.43 17.17 3.72 17.16L5.35 17.16L5.35 28.25C5.35 28.71 5.53 29.15 5.85 29.48C6.16 29.81 6.59 30 7.04 30L10.96 30C11.4 30 11.83 29.81 12.14 29.48C12.46 29.15 12.64 28.71 12.64 28.25L12.64 21.83C12.64 21.36 12.81 20.92 13.13 20.59C13.44 20.26 13.87 20.08 14.31 20.08L17.68 20.08C18.12 20.08 18.55 20.26 18.86 20.59C19.18 20.92 19.35 21.36 19.35 21.83L19.35 28.25C19.35 28.71 19.53 29.15 19.85 29.48C20.16 29.81 20.59 30 21.04 30L24.96 30C25.4 30 25.83 29.81 26.14 29.48C26.46 29.15 26.64 28.71 26.64 28.25L26.64 17.16L28.27 17.16C28.56 17.17 28.86 17.09 29.12 16.94C29.38 16.79 29.6 16.57 29.76 16.31C29.96 15.96 30.03 15.56 29.98 15.16C29.92 14.76 29.73 14.39 29.45 14.12Z" fill-opacity="1.000000" fill-rule="nonzero"/>
            </svg>
        </button>
        {:else}
        <a href="/home">
            <svg width="11vw" height="11vw" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                <desc>
                        Created with Pixso.
                </desc>
                <defs/>
                <path id="Vector" fill={'#7F7F7F'} d="M29.45 14.12L17.12 2.45C16.82 2.16 16.41 2 16 2C15.58 2 15.17 2.16 14.87 2.45L2.54 14.12C2.26 14.39 2.07 14.76 2.01 15.16C1.96 15.56 2.03 15.96 2.23 16.31C2.39 16.57 2.61 16.79 2.87 16.94C3.13 17.09 3.43 17.17 3.72 17.16L5.35 17.16L5.35 28.25C5.35 28.71 5.53 29.15 5.85 29.48C6.16 29.81 6.59 30 7.04 30L10.96 30C11.4 30 11.83 29.81 12.14 29.48C12.46 29.15 12.64 28.71 12.64 28.25L12.64 21.83C12.64 21.36 12.81 20.92 13.13 20.59C13.44 20.26 13.87 20.08 14.31 20.08L17.68 20.08C18.12 20.08 18.55 20.26 18.86 20.59C19.18 20.92 19.35 21.36 19.35 21.83L19.35 28.25C19.35 28.71 19.53 29.15 19.85 29.48C20.16 29.81 20.59 30 21.04 30L24.96 30C25.4 30 25.83 29.81 26.14 29.48C26.46 29.15 26.64 28.71 26.64 28.25L26.64 17.16L28.27 17.16C28.56 17.17 28.86 17.09 29.12 16.94C29.38 16.79 29.6 16.57 29.76 16.31C29.96 15.96 30.03 15.56 29.98 15.16C29.92 14.76 29.73 14.39 29.45 14.12Z" fill-opacity="1.000000" fill-rule="nonzero"/>
            </svg>
        </a>
        {/if}
        <a href="/chat">
            <svg width="11vw" height="11vw" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                <desc>
                        Created with Pixso.
                </desc>
                <defs>
                    <clipPath id="clip43_515">
                        <rect id="chat icon" width="48.000000" height="48.000000" transform="translate(-0.333496 0.000000)" fill="white" fill-opacity="0"/>
                    </clipPath>
                </defs>
                <rect id="chat icon" width="48.000000" height="48.000000" transform="translate(-0.333496 0.000000)" fill="#FFFFFF" fill-opacity="0"/>
                <g clip-path="url(#clip43_515)">
                    <path id="Vector" fill={activePage == Pages.Chat ? '#FFD241' : '#7F7F7F'} d="M35.66 2L11.66 2C9.01 2 6.47 3.05 4.59 4.93C2.72 6.8 1.66 9.34 1.66 12L1.66 28C1.66 30.3 2.46 32.53 3.92 34.32C5.38 36.1 7.4 37.33 9.66 37.8L9.66 44C9.66 44.36 9.76 44.71 9.95 45.02C10.13 45.33 10.4 45.59 10.72 45.76C11.04 45.93 11.4 46.01 11.76 45.99C12.12 45.98 12.47 45.86 12.77 45.66L24.26 38L35.66 38C38.31 37.99 40.85 36.94 42.73 35.06C44.6 33.19 45.66 30.65 45.66 28L45.66 12C45.66 9.34 44.6 6.8 42.73 4.93C40.85 3.05 38.31 2 35.66 2ZM31.66 26L15.66 26C15.13 26 14.62 25.78 14.25 25.41C13.87 25.03 13.66 24.53 13.66 24C13.66 23.46 13.87 22.96 14.25 22.58C14.62 22.21 15.13 22 15.66 22L31.66 22C32.19 22 32.7 22.21 33.08 22.58C33.45 22.96 33.66 23.46 33.66 24C33.66 24.53 33.45 25.03 33.08 25.41C32.7 25.78 32.19 26 31.66 26ZM35.66 18L11.66 18C11.13 18 10.62 17.78 10.25 17.41C9.87 17.03 9.66 16.53 9.66 16C9.66 15.46 9.87 14.96 10.25 14.58C10.62 14.21 11.13 14 11.66 14L35.66 14C36.19 14 36.7 14.21 37.08 14.58C37.45 14.96 37.66 15.46 37.66 16C37.66 16.53 37.45 17.03 37.08 17.41C36.7 17.78 36.19 18 35.66 18Z" fill-opacity="1.000000" fill-rule="nonzero"/>
                </g>
            </svg>
        </a>
        {#if activePage === Pages.Profile}
        <a href='/home'>
            <svg width="11vw" height="11vw" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                <desc>
                        Created with Pixso.
                </desc>
                <defs>
                    <clipPath id="clip59_2877">
                        <rect id="map icon" width="48.000000" height="48.000000" transform="translate(-0.666504 0.000000)" fill="white" fill-opacity="0"/>
                    </clipPath>
                </defs>
                <rect id="map icon" width="48.000000" height="48.000000" transform="translate(-0.666504 0.000000)" fill="#FFFFFF" fill-opacity="0"/>
                <g clip-path="url(#clip59_2877)">
                    <path id="Vector" fill={'#7F7F7F'} d="M12.86 25.27L10.98 25.27C10.73 25.27 10.5 25.34 10.3 25.48C10.09 25.61 9.94 25.8 9.84 26.02L4.63 38.16L17.01 31.84C15.53 29.78 14.06 27.52 12.86 25.27ZM36.82 26.02C36.72 25.8 36.56 25.61 36.36 25.48C36.16 25.34 35.92 25.27 35.68 25.27L33.8 25.27C31.53 29.52 28.23 33.91 26.13 36.33C24.65 38.02 22.01 38.02 20.53 36.33C20.38 36.15 19.59 35.24 18.51 33.84L16.28 34.98L24.72 43.41L40.72 35.11L36.82 26.02ZM3.1 41.71L2.43 43.28C2.08 44.09 2.68 44.99 3.56 44.99L21.7 44.99C21.81 44.91 21.81 44.92 22.42 44.6L13.96 36.16L3.1 41.71ZM44.23 43.28L41.7 37.39L27.02 44.99L43.09 44.99C43.98 44.99 44.58 44.09 44.23 43.28ZM24.56 14.1C24.56 13.42 24.01 12.86 23.33 12.86C22.65 12.86 22.09 13.42 22.09 14.1C22.09 14.78 22.65 15.33 23.33 15.33C24.01 15.33 24.56 14.78 24.56 14.1Z" fill-opacity="1.000000" fill-rule="nonzero"/>
                    <path id="Vector" fill={'#7F7F7F'} d="M24.26 34.63C24.68 34.15 34.45 22.85 34.45 15.08C34.45 -0.94 12.21 -1.13 12.21 15.08C12.21 22.85 21.98 34.15 22.4 34.63C22.89 35.19 23.77 35.19 24.26 34.63ZM19.62 14.1C19.62 12.06 21.29 10.4 23.33 10.4C25.37 10.4 27.03 12.06 27.03 14.1C27.03 16.13 25.37 17.79 23.33 17.79C21.29 17.79 19.62 16.13 19.62 14.1Z" fill-opacity="1.000000" fill-rule="nonzero"/>
                </g>
            </svg>
        </a>
        {:else}
        <button on:click={handleTrip}>
            <svg width="11vw" height="11vw" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                <desc>
                        Created with Pixso.
                </desc>
                <defs>
                    <clipPath id="clip59_2877">
                        <rect id="map icon" width="48.000000" height="48.000000" transform="translate(-0.666504 0.000000)" fill="white" fill-opacity="0"/>
                    </clipPath>
                </defs>
                <rect id="map icon" width="48.000000" height="48.000000" transform="translate(-0.666504 0.000000)" fill="#FFFFFF" fill-opacity="0"/>
                <g clip-path="url(#clip59_2877)">
                    <path id="Vector" fill={activePage == Pages.Trip ? '#FFD241' : '#7F7F7F'} d="M12.86 25.27L10.98 25.27C10.73 25.27 10.5 25.34 10.3 25.48C10.09 25.61 9.94 25.8 9.84 26.02L4.63 38.16L17.01 31.84C15.53 29.78 14.06 27.52 12.86 25.27ZM36.82 26.02C36.72 25.8 36.56 25.61 36.36 25.48C36.16 25.34 35.92 25.27 35.68 25.27L33.8 25.27C31.53 29.52 28.23 33.91 26.13 36.33C24.65 38.02 22.01 38.02 20.53 36.33C20.38 36.15 19.59 35.24 18.51 33.84L16.28 34.98L24.72 43.41L40.72 35.11L36.82 26.02ZM3.1 41.71L2.43 43.28C2.08 44.09 2.68 44.99 3.56 44.99L21.7 44.99C21.81 44.91 21.81 44.92 22.42 44.6L13.96 36.16L3.1 41.71ZM44.23 43.28L41.7 37.39L27.02 44.99L43.09 44.99C43.98 44.99 44.58 44.09 44.23 43.28ZM24.56 14.1C24.56 13.42 24.01 12.86 23.33 12.86C22.65 12.86 22.09 13.42 22.09 14.1C22.09 14.78 22.65 15.33 23.33 15.33C24.01 15.33 24.56 14.78 24.56 14.1Z" fill-opacity="1.000000" fill-rule="nonzero"/>
                    <path id="Vector" fill={activePage == Pages.Trip ? '#FFD241' : '#7F7F7F'} d="M24.26 34.63C24.68 34.15 34.45 22.85 34.45 15.08C34.45 -0.94 12.21 -1.13 12.21 15.08C12.21 22.85 21.98 34.15 22.4 34.63C22.89 35.19 23.77 35.19 24.26 34.63ZM19.62 14.1C19.62 12.06 21.29 10.4 23.33 10.4C25.37 10.4 27.03 12.06 27.03 14.1C27.03 16.13 25.37 17.79 23.33 17.79C21.29 17.79 19.62 16.13 19.62 14.1Z" fill-opacity="1.000000" fill-rule="nonzero"/>
                </g>
            </svg>
        </button>
        {/if}
        <a href="/profile">
            <svg width="11vw" height="11vw" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                <desc>
                        Created with Pixso.
                </desc>
                <defs>
                    <clipPath id="clip51_5126">
                        <rect id="profile icon" width="48.000000" height="48.000000" fill="white" fill-opacity="0"/>
                    </clipPath>
                </defs>
                <rect id="profile icon" width="48.000000" height="48.000000" fill="#FFFFFF" fill-opacity="0"/>
                <g clip-path="url(#clip51_5126)">
                    <path id="Social Icon" fill={activePage == Pages.Profile ? '#FFD241' : '#7F7F7F'} d="M24 0C10.74 0 0 10.74 0 24C0 37.25 10.74 48 24 48C37.25 48 48 37.25 48 24C48 10.74 37.25 0 24 0ZM24 7.31C25.7 7.31 27.36 7.81 28.78 8.76C30.2 9.71 31.3 11.05 31.95 12.63C32.61 14.2 32.78 15.93 32.44 17.6C32.11 19.27 31.29 20.81 30.09 22.01C28.88 23.22 27.35 24.04 25.68 24.37C24 24.7 22.27 24.53 20.7 23.88C19.12 23.23 17.78 22.12 16.83 20.71C15.89 19.29 15.38 17.63 15.38 15.92C15.38 13.64 16.29 11.45 17.9 9.83C19.52 8.22 21.71 7.31 24 7.31ZM38.4 36C36.64 38.11 34.43 39.81 31.95 40.98C29.46 42.14 26.74 42.75 24 42.75C21.25 42.75 18.53 42.14 16.04 40.98C13.56 39.81 11.35 38.11 9.59 36C9.36 35.72 9.19 35.38 9.1 35.02C9.02 34.66 9.02 34.28 9.11 33.92C9.93 30.61 11.83 27.66 14.51 25.55C14.91 25.23 15.4 25.06 15.91 25.05C16.42 25.04 16.91 25.2 17.32 25.51C19.1 26.83 21.44 27.63 23.99 27.63C26.54 27.63 28.88 26.83 30.66 25.51C31.07 25.2 31.57 25.04 32.07 25.05C32.58 25.06 33.07 25.23 33.47 25.55C36.15 27.66 38.05 30.61 38.87 33.92C38.96 34.28 38.96 34.66 38.88 35.02C38.8 35.38 38.63 35.72 38.4 36Z" fill-opacity="1.000000" fill-rule="nonzero"/>
                </g>
            </svg>
        </a>  
    </div>
</div>