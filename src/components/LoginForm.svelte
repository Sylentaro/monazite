<script lang="ts">
	import { goto } from "$app/navigation";
	import type { Passenger } from "../ts/types";
    
    let login: string = '';
    let password = '';
  
    async function handleSubmit() {
        const loginData: Passenger = {login: login, password: password, email:''}
        const response = await fetch('/api/passenger/login', {
            method: 'POST',
            body: JSON.stringify(loginData)
        });
        if (response.ok) {
            console.log("responese")
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
    button.absolute {
        border: 2px solid rgb(255, 210, 65);
		border-radius: 6px;
        background: rgb(0, 0, 0);
    }
</style>
  
<form on:submit|preventDefault={handleSubmit}>
    <div class="mt-8 flex flex-col justify-start items-start gap-6">
        <input bind:value={login} class="h-12 w-96 rounded-md" placeholder="Your login" required>
        <input type="password" bind:value={password} class="h-12 w-96 rounded-md" placeholder="Your password" required>
    </div>
    <div class="relative">
        <button class="absolute left-0 top-3 w-[182px] h-[38px] font-jakarta text-base text-yellow-app font-medium text-center">Forgot password?</button>
    </div>
    <div class="flex flex-col items-center mt-28 gap-2">
        <button type="submit" class="w-48 h-16 bg-yellow-app rounded-md font-jakarta text-2xl font-extrabold">Login</button>      
        <span class="font-jakarta text-2xl text-yellow-app font-medium">or</span>
        <a href="/register">
            <button class="relative flex flex-row justify-center items-center w-[218px] h-10 border-solid border-2 border-yellow-app rounded-md text-yellow-app text-[17px] font-jakarta font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-[6px] icon icon-tabler icon-tabler-plus" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="#FFD241" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M12 5l0 14" />
                    <path d="M5 12l14 0" />
                  </svg>
                <span class="absolute right-4 bottom-[7px]">
                    Create new Account
                </span> 
            </button>
        </a>
    </div>
</form>

  