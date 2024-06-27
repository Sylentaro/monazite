<script lang="ts">
	import type { Driver, Passenger } from "@prisma/client";
	import { onMount } from "svelte";
	let numberInput1: any;
	let numberInput2: any;
	let numberInput3: any;
	let pricePerMeter: any = null;
	let priceStart: any = null;
	let priceKm: any = null;
	async function handleSubmit1(e: any) {
		e.preventDefault();
		await updatePriceStart();
	}
	async function handleSubmit2(e: any) {
		e.preventDefault();
		await updatePricePerMeter();
	}
	async function handleSubmit3(e: any) {
		e.preventDefault();
		await updatePriceKm();
	}
    export async function getPricePerMeter() {
        const response = await fetch("/api/settings/pricePerMeter/read",
            {
                method: 'GET'
            }
        )
        if (response.ok) {
            let data = await response.json()
            pricePerMeter = data
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
            priceStart = data
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
            priceKm = data
        }
    }
    export async function updatePricePerMeter() {
        const response = await fetch("/api/settings/pricePerMeter/update",
            {
                method: 'POST',
				body: JSON.stringify({value: numberInput2})
            }
        )
        if (response.ok) {
            let data = await response.json()
            pricePerMeter = data
        }
    }
    export async function updatePriceStart() {
        const response = await fetch("/api/settings/priceStart/update",
            {
                method: 'POST',
				body: JSON.stringify({value: numberInput1})
            }
        )
        if (response.ok) {
            let data = await response.json()
            priceStart = data
        }
    }
    export async function updatePriceKm() {
        const response = await fetch("/api/settings/priceKm/update",
            {
                method: 'POST',
				body: JSON.stringify({value: numberInput3})
            }
        )
        if (response.ok) {
            let data = await response.json()
            priceKm = data
        }
    }
	onMount(async () => {
		await getPriceKm();
		await getPricePerMeter();
		await getPriceStart();
    });
</script>
<head>
	<title>Admin</title>
	<!-- <link rel="stylesheet" href="style.css"> -->
	<meta charset="UTF-8">
</head>
{#if pricePerMeter && priceStart && priceKm}
	<body class="w-screen h-screen bg-slate-950 flex justify-center">
		<div class="text-white flex flex-col items-center">
		<span class="text-4xl">Panel Administratora</span>
		<span class="text-2xl mt-4">Zmień ustawienia</span>
		<div class="mt-4 flex flex-col gap-2 items-center">
			<div class="border-yellow-app border-2 rounded-md p-3 items-center flex flex-col gap-2">
				<span class="text-3xl">Cena bazowa</span>
				<span>
					<b>Wartość: </b>{priceStart. value}
				</span>
				<div class="flex flex-col items-center justify-center">
					Zmień wartość:
					<form class="mt-1 w-1/2" on:submit={handleSubmit1}>
						<div class="flex flex-col ">
							<input type="number" class="w-full" id="numberInput" bind:value={numberInput1} required min="0">
							<button class="border-yellow-app border-2 rounded-md mt-2" type="submit">Zmień</button>
						</div>
					</form> 
				</div>
				<span>
					Ostatnia aktualizacja: {priceStart.updatedAt}
				</span>
			</div>
			<div class="border-yellow-app border-2 rounded-md p-3 items-center flex flex-col gap-2">
				<span class="text-3xl">Cena za metr (mnożnik)</span>
				<span>
					<b>Wartość: </b>{pricePerMeter. value}
				</span>
				<div class="flex flex-col items-center justify-center">
					Zmień wartość:
					<form class="mt-1 w-1/2" on:submit={handleSubmit2}>
						<div class="flex flex-col ">
							<input type="number" class="w-full" id="numberInput" bind:value={numberInput2} required min="0">
							<button class="border-yellow-app border-2 rounded-md mt-2" type="submit">Zmień</button>
						</div>
					</form> 
				</div>
				<span>
					Ostatnia aktualizacja: {pricePerMeter.updatedAt}
				</span>
			</div>
			<div class="border-yellow-app border-2 rounded-md p-3 items-center flex flex-col gap-2">
				<span class="text-3xl">Koszt dodatkowy za każdy kilometr</span>
				<span>
					<b>Wartość: </b>{priceKm. value}
				</span>
				<div class="flex flex-col items-center justify-center">
					Zmień wartość:
					<form class="mt-1 w-1/2" on:submit={handleSubmit3}>
						<div class="flex flex-col ">
							<input type="number" class="w-full" id="numberInput" bind:value={numberInput3} required min="0">
							<button class="border-yellow-app border-2 rounded-md mt-2" type="submit">Zmień</button>
						</div>
					</form> 
				</div>
				<span>
					Ostatnia aktualizacja: {priceKm.updatedAt}
				</span>
			</div>
		</div>
		</div>
	</body>	
{/if}
