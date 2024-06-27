<script lang="ts">
	import type { Driver, Passenger, Trip } from "@prisma/client";
	import { onMount } from "svelte";
	let trips: Trip[]
	async function fetchTrips() {
        const response = await fetch('/api/trip/getAllTrips', {
            method: 'GET',
         //   body: JSON.stringify({id: user.onGoing})
        })
        if (response.ok) {
			trips = await response.json();
        }
	}
	async function deleteTrip(id: number) {
        const response = await fetch('/api/trip/deleteTrip', {
            method: 'POST',
          	body: JSON.stringify({id: id})
        })
        if (response.ok) {
			await fetchTrips()
        }
	}
	onMount(async () => {
		await fetchTrips();
    });
</script>
<head>
	<title>Page Title</title>
	<meta charset="UTF-8">
</head>
<body class="admbody">
	<div class="container">
		<h1>Trips</h1>
		<div class="button"><a href="/adm">Back</a></div>
		<table class="table">
			<tr>
				<th>ID</th>
				<th>rating</th>
				<th>startAddress</th>
				<th>destination</th>
				<th>passengerId</th>
				<th>driverId</th>
                <th>price</th>
                <th>state</th>
                <th>date</th>
			</tr>
			{#if trips}
				{#each trips as item (item.id)}
				<tr>
					<td>{item.id}</td>
					<td>{item.rating}</td>
					<td>{item.startAddress}</td>
					<td>{item.destination}</td>
					<td>{item.passengerId}</td>
                    <td>{item.driverId}</td>
                    <td>{item.price}</td>
                    <td>{item.state}</td>
                    <td>{item.date}</td>
					<td>
						<button on:click={() => {
							deleteTrip(item.id)
						}}>Delete</button>
						<br/>
						<button>Edit</button>
					</td>
				</tr>
				{/each}
			{/if}
		</table>
	</div>	
</body>