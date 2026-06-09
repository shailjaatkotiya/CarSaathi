import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { Alert, Box, Button, Card, CardContent, Container, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, Ride } from "../api/client";
import RideCard from "../components/RideCard";

export default function SearchRides() {
  const [source, setSource] = useState("Ahmedabad");
  const [destination, setDestination] = useState("Rajkot");
  const [sourceArea, setSourceArea] = useState("");
  const [destinationArea, setDestinationArea] = useState("");
  const [journeyDate, setJourneyDate] = useState("");
  const [departureAfter, setDepartureAfter] = useState("");
  const [departureBefore, setDepartureBefore] = useState("");
  const [carType, setCarType] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [driverRating, setDriverRating] = useState("");
  const [acAvailable, setAcAvailable] = useState("");
  const [sortBy, setSortBy] = useState("date_time");
  const [seats, setSeats] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "rides",
      source,
      destination,
      sourceArea,
      destinationArea,
      journeyDate,
      departureAfter,
      departureBefore,
      carType,
      fuelType,
      minPrice,
      maxPrice,
      driverRating,
      acAvailable,
      sortBy,
      seats
    ],
    queryFn: async () => {
      const response = await api.get<Ride[]>("/passenger/rides/search", {
        params: {
          source,
          destination,
          source_area: sourceArea || undefined,
          destination_area: destinationArea || undefined,
          journey_date: journeyDate || undefined,
          departure_after: departureAfter || undefined,
          departure_before: departureBefore || undefined,
          car_type: carType || undefined,
          fuel_type: fuelType || undefined,
          min_price: minPrice || undefined,
          max_price: maxPrice || undefined,
          driver_rating: driverRating || undefined,
          ac_available: acAvailable || undefined,
          sort_by: sortBy,
          seats
        }
      });
      return response.data;
    }
  });

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, pb: 11 }}>
      <Stack spacing={3}>
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <TuneRoundedIcon color="primary" />
                  <Typography variant="h4" sx={{ fontSize: { xs: 28, md: 34 } }}>
                    Passenger ride search
                  </Typography>
                </Stack>
                <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 780 }}>
                  Compare friendly car rides by city, local area, date, time, price, rating, fuel, AC, seats, and car category.
                </Typography>
              </Box>
              <Button variant="contained" startIcon={<SearchRoundedIcon />} onClick={() => refetch()} sx={{ alignSelf: { xs: "stretch", md: "center" } }}>
                Search rides
              </Button>
            </Stack>

            <Box sx={{ mt: 3, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 2 }}>
              <TextField label="Source city" value={source} onChange={(event) => setSource(event.target.value)} placeholder="Ahmedabad" />
              <TextField label="Destination city" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Rajkot" />
              <TextField label="Pickup area" value={sourceArea} onChange={(event) => setSourceArea(event.target.value)} placeholder="Bopal, Gota, Iscon" />
              <TextField label="Stop or drop area" value={destinationArea} onChange={(event) => setDestinationArea(event.target.value)} placeholder="Chotila, Limbdi" />
              <TextField label="Journey date" type="date" value={journeyDate} onChange={(event) => setJourneyDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Departure after" type="time" value={departureAfter} onChange={(event) => setDepartureAfter(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Departure before" type="time" value={departureBefore} onChange={(event) => setDepartureBefore(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Seats needed" type="number" value={seats} onChange={(event) => setSeats(Number(event.target.value))} slotProps={{ htmlInput: { min: 1 } }} />
              <TextField label="Minimum price" type="number" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Rs. 150" />
              <TextField label="Maximum price" type="number" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Rs. 650" />
              <TextField label="Minimum driver rating" select value={driverRating} onChange={(event) => setDriverRating(event.target.value)}>
                <MenuItem value="">Any rating</MenuItem>
                <MenuItem value="4">4.0+ stars</MenuItem>
                <MenuItem value="4.5">4.5+ stars</MenuItem>
                <MenuItem value="4.8">4.8+ stars</MenuItem>
              </TextField>
              <TextField label="Car category" select value={carType} onChange={(event) => setCarType(event.target.value)}>
                <MenuItem value="">All car categories</MenuItem>
                <MenuItem value="SUV">SUV</MenuItem>
                <MenuItem value="Sedan">Sedan</MenuItem>
                <MenuItem value="7 Seater">7 Seater</MenuItem>
              </TextField>
              <TextField label="Fuel type" select value={fuelType} onChange={(event) => setFuelType(event.target.value)}>
                <MenuItem value="">All fuel types</MenuItem>
                <MenuItem value="Petrol">Petrol</MenuItem>
                <MenuItem value="CNG">CNG</MenuItem>
                <MenuItem value="EV">EV</MenuItem>
                <MenuItem value="Diesel">Diesel</MenuItem>
              </TextField>
              <TextField label="AC preference" select value={acAvailable} onChange={(event) => setAcAvailable(event.target.value)}>
                <MenuItem value="">AC and non-AC</MenuItem>
                <MenuItem value="true">AC only</MenuItem>
                <MenuItem value="false">Non-AC only</MenuItem>
              </TextField>
              <TextField label="Sort rides" select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <MenuItem value="date_time">Sort by date</MenuItem>
                <MenuItem value="time">Sort by time</MenuItem>
                <MenuItem value="price">Sort by price</MenuItem>
              </TextField>
            </Box>
          </CardContent>
        </Card>

        <Stack spacing={2}>
          {isLoading && <Alert severity="info">Loading rides...</Alert>}
          {data?.map((ride) => <RideCard key={ride.id} ride={ride} />)}
          {data?.length === 0 && <Alert severity="warning">No rides found for this route.</Alert>}
        </Stack>
      </Stack>
    </Container>
  );
}
