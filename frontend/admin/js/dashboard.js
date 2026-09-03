function iniciarDashboard() {

    const calendarioElemento =
        document.getElementById("calendario-dashboard");


    if (!calendarioElemento) {
        return;
    }


    const calendario = new FullCalendar.Calendar(
        calendarioElemento,
        {

            initialView: "dayGridMonth",

            locale: "es",

            height: "auto",

            headerToolbar: {
                left: "prev,next today",
                center: "title",
                right: ""
            },


            events: [

                {
                    title: "09:00 - Dr. Martínez",
                    start: "2023-10-18T09:00:00"
                },

                {
                    title: "09:30 - Dra. López",
                    start: "2023-10-18T09:30:00"
                },

                {
                    title: "11:00 - Dr. Martínez",
                    start: "2023-10-18T11:00:00"
                },

                {
                    title: "14:00 - Dr. Pérez",
                    start: "2023-10-18T14:00:00"
                },

                {
                    title: "10:00 - Dra. López",
                    start: "2023-10-20T10:00:00"
                }

            ]

        }
    );


    calendario.render();
}