

async function restart() {
    const response = await fetch('/thesis/api/restart', {
        method: 'POST'
    });
    console.log("Restart response: ", response);
}