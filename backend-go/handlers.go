package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

func pingHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := db.Ping(); err != nil {
			http.Error(w, "database connection error", http.StatusInternalServerError)
			return
		}
		resp := map[string]string{"status": "ok"}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}
