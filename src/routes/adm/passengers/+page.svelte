<script lang="ts">
	import type { Passenger } from "@prisma/client";
	import { onMount } from "svelte";
	let passengers: Passenger[]
	async function fetchPassengers() {
        const response = await fetch('/api/passenger/getAllPassengers', {
            method: 'GET',
         //   body: JSON.stringify({id: user.onGoing})
        })
        if (response.ok) {
			passengers = await response.json();
        }
	}
	async function deletePassenger(id: number) {
        const response = await fetch('/api/passenger/deletePassenger', {
            method: 'POST',
          	body: JSON.stringify({id: id})
        })
        if (response.ok) {
			await fetchPassengers()
        }
	}
	onMount(async () => {
		await fetchPassengers();
    });
</script>
<head>
	<title>Page Title</title>
	<meta charset="UTF-8">
</head>
<body class="admbody">
	<div class="container">
		<h1>Passengers</h1>
		<div class="button"><a href="/adm">Back</a></div>
		<table class="table">
			<tr>
				<th>ID</th>
				<th>login</th>
				<th>email</th>
				<th>password</th>
				<th>onGoingTripId</th>
				<th>Operations</th>
			</tr>
			{#if passengers}
				{#each passengers as item (item.id)}
				<tr>
					<td>{item.id}</td>
					<td>{item.login}</td>
					<td>{item.email}</td>
					<td>{item.password}</td>
					<td>{item.onGoing}</td>
					<td>
						<button on:click={() => {
							deletePassenger(item.id)
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