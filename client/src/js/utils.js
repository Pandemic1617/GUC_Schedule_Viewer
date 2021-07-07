let escapeHTML = (text) => {
    let a = document.createElement('div');
    a.appendChild(document.createTextNode(text));
    return a.innerHTML;
}


export { escapeHTML };