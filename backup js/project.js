const selected = JSON.parse(

    localStorage.getItem("selectedAssessments")

) || [];

const tbody = document.getElementById("projectTable");

selected.forEach(item=>{

    tbody.innerHTML += `

    <tr>

        <td>${item.code}</td>

        <td>${item.name}</td>

        <td>${item.category}</td>

        <td>${item.duration} Minutes</td>

    </tr>

    `;

});