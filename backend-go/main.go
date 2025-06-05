package main

import (
	"log"
	"net/http"
)

func main() {
	db := initDB()
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("/api/ping", pingHandler(db))

	port := getEnv("PORT", "8000")
	log.Printf("Server listening on %s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}
