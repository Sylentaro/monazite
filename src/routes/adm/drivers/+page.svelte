<script lang="ts">
	import type { Driver, Passenger } from "@prisma/client";
	import { onMount } from "svelte";
	let drivers: Driver[]
	async function fetchDrivers() {
        const response = await fetch('/api/driver/getAllDrivers', {
            method: 'GET',
         //   body: JSON.stringify({id: user.onGoing})
        })
        if (response.ok) {
			drivers = await response.json();
        }
	}
	async function deleteDriver(id: number) {
        const response = await fetch('/api/driver/deleteDriver', {
            method: 'POST',
          	body: JSON.stringify({id: id})
        })
        if (response.ok) {
			await fetchDrivers()
        }
	}
	onMount(async () => {
		await fetchDrivers();
    });
</script>
<head>
	<title>Page Title</title>
	<meta charset="UTF-8">
</head>
<body class="admbody">
	<div class="container">
		<h1>Drivers</h1>
		<div class="button"><a href="/adm">Back</a></div>
		<table class="table">
			<tr>
				<th>ID</th>
				<th>login</th>
				<th>email</th>
				<th>password</th>
                <th>carDescription</th>
				<th>onGoingTripId</th>
				<th>Operations</th>
			</tr>
			{#if drivers}
				{#each drivers as item (item.id)}
				<tr>
					<td>{item.id}</td>
					<td>{item.login}</td>
					<td>{item.email}</td>
					<td>{item.password}</td>
                    <td>{item.carDescription}</td>
					<td>{item.onGoing}</td>
					<td>
						<button on:click={() => {
							deleteDriver(item.id)
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