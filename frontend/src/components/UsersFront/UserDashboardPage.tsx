import React, { useState, useEffect, useMemo } from "react";
import {
	Box,
	Paper,
	Typography,
	Button,
	CircularProgress,
	List,
	ListItem,
	ListItemText,
	Divider,
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';

import CreateReservationDialog from "./CreateReservationDialog";
import getCookie from "../../context/getCookie";

// --- Couleur Accessible (Contrast > 4.5:1) ---
const ACCESSIBLE_BLUE = "#2A4AE5";

interface Lock {
	id_lock: number;
	name: string;
}

interface CurrentUser {
	id: number;
	username: string;
	is_staff: boolean;
}

interface Reservation {
	id: number;
	lock: Lock;
	date: string;
	start_time: string;
	end_time: string;
	status: 'pending' | 'approved' | 'rejected';
}

interface UserDashboardPageProps {
	user: CurrentUser;
	onNavigate: (page: string) => void;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const formatTime = (time: string) => time.slice(0, 5);

const UserDashboardPage: React.FC<UserDashboardPageProps> = ({ user, onNavigate }) => {
	const [reservations, setReservations] = useState<Reservation[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	const fetchReservations = async () => {
		setLoading(true);
		setError("");
		try {
			const csrfToken = getCookie("csrftoken");
			const headers: HeadersInit = csrfToken ? { "X-CSRFToken": csrfToken } : {};

			const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/reservations/`, {
				method: "GET",
				credentials: "include",
				headers: headers,
			});

			if (!response.ok) {
				throw new Error("Failed to load reservations.");
			}

			const data: Reservation[] = await response.json();
			setReservations(data);

		} catch (err: any) {
			setError(err.message || "An unknown error occurred.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchReservations();
	}, []);

	const getStatusColor = (status: Reservation['status']) => {
		if (status === 'approved') return 'success.main';
		if (status === 'pending') return 'warning.main';
		if (status === 'rejected') return 'error.main';
		return 'text.secondary';
	};

	const pendingReservations = useMemo(
		() => reservations.filter(r => r.status === 'pending'),
		[reservations]
	);

	const processedReservations = useMemo(
		() => reservations.filter(r => r.status === 'approved' || r.status === 'rejected')
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
		[reservations]
	);

	const ReservationItem: React.FC<{ res: Reservation }> = ({ res }) => (
		<React.Fragment>
			<ListItem disablePadding sx={{ py: 1.5 }}>
				<ListItemText
					primary={
						<Typography sx={{ fontWeight: 500, color: '#111' }}>
							{res.lock.name}
						</Typography>
					}
					secondary={
						`On ${res.date} from ${formatTime(res.start_time)} to ${formatTime(res.end_time)}`
					}
				/>
				<Typography
					sx={{
						fontWeight: 600,
						color: getStatusColor(res.status),
						flexShrink: 0,
						ml: 2,
					}}
				>
					{capitalize(res.status)}
				</Typography>
			</ListItem>
			<Divider component="li" />
		</React.Fragment>
	);


	return (
		<Box sx={{ p: 4 }}>

			{/* --- En-tête de Page --- */}
			<Box
				component="header" // Sémantique
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					flexWrap: 'wrap',
					gap: 2,
					mb: 4
				}}
			>
				<Box>
					<Typography
						variant="h4"
						component="h1" // Titre principal H1
						sx={{ fontWeight: 700, color: "#333" }}
					>
						Hello, {user.username}!
					</Typography>
					<Typography variant="h6" sx={{ color: "#555", fontWeight: 400 }}>
						Welcome to your reservation space.
					</Typography>
				</Box>
				<Button
					variant="contained"
					onClick={() => setIsCreateOpen(true)}
					startIcon={<AddIcon />}
					sx={{
						backgroundColor: ACCESSIBLE_BLUE, // Bleu accessible
						textTransform: "none",
						fontWeight: 600,
						boxShadow: "none",
						py: 1.5,
						px: 3,
						fontSize: '1rem',
						"&:hover": {
							backgroundColor: "#1A3AC0",
						},
					}}
				>
					Request a reservation
				</Button>
			</Box>

			{/* --- Contenu Principal --- */}
			{loading ? (
				<Box
					sx={{ display: 'flex', justifyContent: 'center', py: 5 }}
					role="status"
					aria-label="Loading reservations"
				>
					<CircularProgress />
				</Box>
			) : error ? (
				<Typography color="error" sx={{ textAlign: 'center' }} role="alert">
					{error}
				</Typography>
			) : (
				<Box
					sx={{
						display: 'flex',
						gap: 4,
						flexDirection: { xs: 'column', md: 'row' }
					}}
				>
					{/* --- COLONNE 1: PENDING --- */}
					<Paper
						elevation={0}
						component="section" // Section sémantique
						aria-labelledby="pending-heading"
						sx={{
							p: 3, borderRadius: 2, border: "1px solid #E0E0E0",
							width: { xs: '100%', md: '50%' }
						}}
					>
						<Typography
							id="pending-heading"
							variant="h5"
							component="h2" // Sous-titre H2
							sx={{ fontWeight: 600, color: '#333', mb: 2 }}
						>
							Your Pending Requests
						</Typography>
						<List disablePadding aria-label="List of pending requests">
							{pendingReservations.length === 0 ? (
								<Typography sx={{ textAlign: 'center', color: '#666', p: 2 }}>
									You have no pending requests.
								</Typography>
							) : (
								pendingReservations.map((res) => (
									<ReservationItem key={res.id} res={res} />
								))
							)}
						</List>
					</Paper>

					{/* --- COLONNE 2: HISTORY --- */}
					<Paper
						elevation={0}
						component="section"
						aria-labelledby="history-heading"
						sx={{
							p: 3, borderRadius: 2, border: "1px solid #E0E0E0",
							width: { xs: '100%', md: '50%' }
						}}
					>
						<Typography
							id="history-heading"
							variant="h5"
							component="h2" // Sous-titre H2
							sx={{ fontWeight: 600, color: '#333', mb: 2 }}
						>
							Your Reservation History
						</Typography>
						<Box sx={{ maxHeight: 400, overflow: 'auto' }}>
							<List disablePadding aria-label="List of past reservations">
								{processedReservations.length === 0 ? (
									<Typography sx={{ textAlign: 'center', color: '#666', p: 2 }}>
										No approved or rejected reservations found.
									</Typography>
								) : (
									processedReservations.map((res) => (
										<ReservationItem key={res.id} res={res} />
									))
								)}
							</List>
						</Box>
					</Paper>
				</Box>
			)}

			<CreateReservationDialog
				open={isCreateOpen}
				onClose={() => setIsCreateOpen(false)}
				onReservationCreated={() => {
					fetchReservations();
				}}
			/>
		</Box>
	);
};

export default UserDashboardPage;
