async function listModels() {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + "AIzaSyCxc7wBosKQGGmvOPfEGvzXZplYveG8Xgs");
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}

listModels();
