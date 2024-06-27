<script lang="ts">
	import { goto } from "$app/navigation";
	import type { Passenger } from "../ts/types";
    
    let login: string = '';
    let password = '';
    let email = '';
  
    async function handleSubmit() {
        console.log("sub");
        const registerData: Passenger = {login: login, password: password, email: email}
        const response = await fetch('/api/passenger/register', {
            method: 'POST',
            body: JSON.stringify(registerData)
        });
        if (response.ok) {
            const authToken = await response.json();
            await localStorage.setItem("authToken", authToken);
            await goto("/home")
        }
      // Tutaj możesz dodać logikę logowania
    };
</script>
  
<style>
    /* Stylizacja za pomocą Tailwind CSS */
    /* .input {
      @apply block w-full mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500;
    } */
    input {
        background-color: rgb(61, 61, 61);
        color: rgb(190, 190, 190);
        font-family: 'Plus Jakarta Sans', 'sans-serif';
        font-size: 20px;
        font-weight: 600;
        padding-left: 8px;
        border-radius: 6px;
        height: 3rem;
        width: 24rem;
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
</style>
  
<form on:submit|preventDefault={handleSubmit}>
    <div class="mt-8 flex flex-col justify-start items-start gap-6">
        <input bind:value={login} class="h-12 w-96 rounded-md" placeholder="Your login" required>
        <input type="password" bind:value={password} class="h-12 w-96 rounded-md" placeholder="Your password" required>
        <input type="email" bind:value={email} class="h-12 w-96 rounded-md" placeholder="Your email" required>
    </div>
    <div class="flex flex-col items-center mt-16 gap-2">
        <button type="submit" class="w-48 h-16 bg-yellow-app rounded-md font-jakarta text-2xl font-extrabold">Register</button>  
        <span class="font-jakarta text-2xl text-yellow-app font-medium">or</span>
        <a href="/">
            <button class="relative flex flex-row justify-center items-center w-[218px] h-10 border-solid border-2 border-yellow-app rounded-md text-yellow-app text-[17px] font-jakarta font-medium">
                <span>
                    Use existing account
                </span> 
            </button>
        </a>
    </div>
</form>