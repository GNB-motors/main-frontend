import React, { useState, useEffect, useMemo } from "react";
import apiClient from "../../utils/axiosConfig";
import SplitTripConfirmationDialog from "./SplitTripConfirmationDialog";
import "./RequestFormPage.css";

// Import assets
import UkoLogo from "../../assets/uko-logo.png";
import ReportDetailsIcon from "../../assets/report-details-icon.svg";
import UploadIcon from "../../assets/upload-icon.svg";
import SuccessIcon from "../../assets/success-icon.svg";
import LoginSubmitIcon from "../../assets/login-submit-icon.svg";

const RequestFormPage = () => {
  const [currentStep, setCurrentStep] = useState(1);

  // This will hold the logged-in user's profile data
  const [tmsProfile, setTmsProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Vehicle data state
  const [vehicles, setVehicles] = useState([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [vehicleError, setVehicleError] = useState(null);

  // Report type selection - Auto-determined based on backend data
  const [reportType, setReportType] = useState(null); // 'custom_trip' | 'since_last_refuel'
  const [latestRefuel, setLatestRefuel] = useState(null);
  const [refuelError, setRefuelError] = useState(null);
  const [isLoadingRefuel, setIsLoadingRefuel] = useState(false);

  const [formData, setFormData] = useState({
    selectedVehicle: "",
    dieselBefore: null,
    dieselAfter: null,
    email: "", // This is ONLY for the Fleet Edge login
    password: "", // This is ONLY for the Fleet Edge login
    loginMethod: "password", // 'password' | 'otp'
    mobileNumber: "", // For mobile OTP login
  });
  const [extractedData, setExtractedData] = useState({
    before: null,
    after: null,
  });
  const [previews, setPreviews] = useState({
    before: null,
    after: null,
  });
  const [error, setError] = useState({
    before: null,
    after: null,
    submit: null,
    profile: null,
  });
  const [isLoading, setIsLoading] = useState({
    before: false,
    after: false,
    submit: false,
  });
  const [finalReportData, setFinalReportData] = useState(null);

  // --- NEW: Overlap detection and split state ---
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [overlapData, setOverlapData] = useState(null);
  const [pendingReceiptData, setPendingReceiptData] = useState(null);
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitProgress, setSplitProgress] = useState([]);

  // --- WS: OTP handling state ---
  const [sessionId, setSessionId] = useState(() => {
    const existing = sessionStorage.getItem("wsSessionId");
    if (existing) return existing;
    const gen =
      window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    sessionStorage.setItem("wsSessionId", gen);
    return gen;
  });
  const [showOtp, setShowOtp] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpStatus, setOtpStatus] = useState(null);
  const [backendWaitingOtp, setBackendWaitingOtp] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = React.useRef([]);

  const WS_URL = useMemo(() => {
    const api = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    return api.replace(/^http/, "ws");
  }, []);

  const [wsReady, setWsReady] = useState(false);
  const [wsConnecting, setWsConnecting] = useState(false);
  const [wsRetryCount, setWsRetryCount] = useState(0);
  const [wsKey, setWsKey] = useState(0); // bump to recreate WS
  const backoffTimerRef = React.useRef(null);
  const currentReconnectRunIdRef = React.useRef(0);
  const [wsError, setWsError] = useState(null);
  const [autoConnectExhausted, setAutoConnectExhausted] = useState(false);
  const ws = useMemo(() => {
    try {
      return new WebSocket(`${WS_URL}/ws/automation?sessionId=${sessionId}`);
    } catch (e) {
      return null;
    }
  }, [WS_URL, sessionId, wsKey]);

  useEffect(() => {
    if (!ws) return;
    setWsReady(false);
    setWsConnecting(true);
    ws.onopen = () => {
      setWsReady(true);
      setWsConnecting(false);
      setWsRetryCount(0);
      setWsError(null);
      setAutoConnectExhausted(false);
      if (backoffTimerRef.current) {
        clearTimeout(backoffTimerRef.current);
        backoffTimerRef.current = null;
      }
    };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "connected") {
          // No-op; wsReady already set in onopen; keep for visibility
        } else if (
          msg.type === "error" &&
          msg.message === "session_already_connected"
        ) {
          setWsError(
            "Another tab/device is already connected for this session.",
          );
          setWsConnecting(false);
          setWsReady(false);
          setAutoConnectExhausted(true);
          // Cancel any ongoing reconnect loop for this tab
          currentReconnectRunIdRef.current += 1;
          if (backoffTimerRef.current) {
            clearTimeout(backoffTimerRef.current);
            backoffTimerRef.current = null;
          }
          try {
            ws.close();
          } catch {}
        } else if (msg.type === "otp_required" || msg.type === "otp_now") {
          setBackendWaitingOtp(true);
          setOtpStatus(null);
          resetOtpInputs();
          setShowOtp(true);
        } else if (msg.type === "status") {
          // Could optionally surface status messages
        } else if (msg.type === "otp_result") {
          setBackendWaitingOtp(false);
          if (msg.ok) {
            setOtpStatus("ok");
            setShowOtp(false);
            resetOtpInputs();
          } else {
            setOtpStatus("error");
            // Auto-close on timeout and surface an error
            if (msg.message === "timeout") {
              setShowOtp(false);
              setError((prev) => ({
                ...prev,
                submit: "OTP timed out. Please try again.",
              }));
              setIsLoading((prev) => ({ ...prev, submit: false }));
            }
          }
        } else if (msg.type === "automation_complete") {
          const data = msg.data;
          if (data) {
            setFinalReportData(data);
            setIsLoading((prev) => ({ ...prev, submit: false }));
            setTimeout(() => goToStep(3), 0);
          } else {
            setError((prev) => ({
              ...prev,
              submit: "Automation completed with no data.",
            }));
            setIsLoading((prev) => ({ ...prev, submit: false }));
          }
        } else if (msg.type === "automation_error") {
          setError((prev) => ({
            ...prev,
            submit: msg.message || "Automation failed.",
          }));
          setIsLoading((prev) => ({ ...prev, submit: false }));
        }
      } catch {
        // ignore malformed
      }
    };
    ws.onclose = () => {
      setWsReady(false);
    };
    return () => {
      try {
        ws.close();
      } catch {}
      setWsReady(false);
      setBackendWaitingOtp(false);
    };
  }, [ws]);

  const computeBackoffDelay = (attemptNumber) => {
    const baseMs = 1000; // 1s
    const maxMs = 15000; // 15s cap
    const jitterRatio = 0.25; // +/-25% jitter
    const exponential = Math.min(baseMs * Math.pow(2, attemptNumber), maxMs);
    const spread = exponential * jitterRatio;
    const min = Math.max(0, exponential - spread);
    const max = exponential + spread;
    return Math.floor(min + Math.random() * (max - min));
  };

  const reconnectWithBackoff = (maxAttempts = 6) => {
    if (wsReady) return;
    setWsConnecting(true);
    // Cancel any in-flight reconnect loop by bumping the run id
    const runId = ++currentReconnectRunIdRef.current;
    const attempt = (n) => {
      // If a newer reconnect loop started, stop this one
      if (runId !== currentReconnectRunIdRef.current) return;
      if (wsReady) {
        setWsConnecting(false);
        return;
      }
      setWsRetryCount(n);
      setWsKey((prev) => prev + 1); // recreate WS
      if (n >= maxAttempts) {
        if (runId !== currentReconnectRunIdRef.current) return;
        setWsConnecting(false);
        setAutoConnectExhausted(true);
        return;
      }
      const delay = computeBackoffDelay(n);
      if (backoffTimerRef.current) clearTimeout(backoffTimerRef.current);
      backoffTimerRef.current = setTimeout(() => attempt(n + 1), delay);
    };
    attempt(0);
  };

  // Auto-connect WS if not connected
  useEffect(() => {
    if (
      !wsReady &&
      !wsConnecting &&
      wsError !== "Another tab/device is already connected for this session." &&
      !autoConnectExhausted
    ) {
      reconnectWithBackoff(6);
    }
    return () => {
      if (backoffTimerRef.current) {
        clearTimeout(backoffTimerRef.current);
      }
    };
  }, [wsReady, wsConnecting, wsError, autoConnectExhausted]);

  const submitOtpWs = () => {
    if (!ws) return;
    const combined = otpDigits.join("").trim() || otpValue.trim();
    if (!combined || combined.length < 4) return;
    ws.send(JSON.stringify({ type: "otp_submit", otp: combined }));
  };

  const resetOtpInputs = () => {
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpValue("");
    setTimeout(() => {
      if (otpRefs.current && otpRefs.current[0]) {
        otpRefs.current[0].focus();
      }
    }, 50);
  };

  const handleOtpChange = (index, val) => {
    const digit = (val || "").replace(/[^0-9]/g, "").slice(0, 1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (
      e.key === "Backspace" &&
      !otpDigits[index] &&
      otpRefs.current[index - 1]
    ) {
      otpRefs.current[index - 1].focus();
    }
    if (e.key === "ArrowLeft" && otpRefs.current[index - 1]) {
      otpRefs.current[index - 1].focus();
    }
    if (e.key === "ArrowRight" && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    try {
      const text = (e.clipboardData.getData("text") || "")
        .replace(/[^0-9]/g, "")
        .slice(0, 6);
      if (text) {
        e.preventDefault();
        const arr = text.split("");
        const next = ["", "", "", "", "", ""];
        for (let i = 0; i < Math.min(arr.length, 6); i++) next[i] = arr[i];
        setOtpDigits(next);
        const focusIndex = Math.min(text.length, 5);
        setTimeout(() => {
          if (otpRefs.current[focusIndex]) otpRefs.current[focusIndex].focus();
        }, 0);
      }
    } catch {}
  };

  // Fetch the user's profile AND vehicles on component load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // 1. Fetch Profile
        const profileResponse = await apiClient.get("api/v1/profile/me");
        const profile = profileResponse.data;
        setTmsProfile(profile);

        // 2. Fetch Vehicles using profile data
        if (profile.business_ref_id) {
          try {
            // Note: Adjust this endpoint if it's different in your API
            const vehiclesResponse = await apiClient.get(
              `api/v1/vehicles/${profile.business_ref_id}`,
            );
            setVehicles(vehiclesResponse.data);
            setVehicleError(null);
          } catch (vehErr) {
            console.error("Error fetching vehicles:", vehErr);
            setVehicleError(
              vehErr.response?.data?.detail || "Failed to load vehicles.",
            );
          } finally {
            setIsLoadingVehicles(false);
          }
        } else {
          setVehicleError(
            "Business ID not found in profile. Cannot load vehicles.",
          );
          setIsLoadingVehicles(false);
        }
      } catch (profErr) {
        // Profile fetch failed
        const errorMsg =
          profErr.response?.data?.detail ||
          "Could not fetch your profile. Please log in again.";
        setError((prev) => ({ ...prev, profile: errorMsg }));
        setIsLoadingVehicles(false); // Can't load vehicles if profile fails
      } finally {
        setIsProfileLoading(false); // Profile loading is done
      }
    };

    fetchInitialData();
  }, []); // Empty array means this runs once on mount

  const goToStep = (step) => setCurrentStep(step);

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Fetch latest refuel for selected vehicle - Auto-determines flow
  const fetchLatestRefuel = async (vehicleRegNo) => {
    if (!tmsProfile || !vehicleRegNo) return;

    setIsLoadingRefuel(true);
    setRefuelError(null);
    setLatestRefuel(null);
    setReportType(null); // Reset report type

    try {
      const response = await apiClient.get(
        `api/v1/ocr/latest-refuel/${tmsProfile.id}/${vehicleRegNo}`
      );
      // Scenario B: Latest receipt exists - use "since_last_refuel" flow
      setLatestRefuel(response.data);
      setReportType("since_last_refuel");
      console.log("✅ Scenario B: Found latest refuel, using since_last_refuel flow");
    } catch (err) {
      if (err.response?.status === 404) {
        // Scenario A: No previous refuel - use "custom_trip" flow
        setReportType("custom_trip");
        setLatestRefuel(null);
        console.log("✅ Scenario A: No refuel history, using custom_trip flow");
      } else {
        const errorMsg = err.response?.data?.detail || "Failed to fetch refuel data.";
        setRefuelError(errorMsg);
        setLatestRefuel(null);
      }
    } finally {
      setIsLoadingRefuel(false);
    }
  };

  // Auto-detect flow when vehicle is selected
  useEffect(() => {
    if (formData.selectedVehicle && tmsProfile) {
      fetchLatestRefuel(formData.selectedVehicle);
      // Reset extracted data when vehicle changes
      setExtractedData({ before: null, after: null });
      setPreviews({ before: null, after: null });
    } else {
      // Reset when no vehicle selected
      setReportType(null);
      setLatestRefuel(null);
    }
  }, [formData.selectedVehicle, tmsProfile]);

  // NEW: Check for receipt overlap
  const checkReceiptOverlap = async (receiptDate, receiptVolume) => {
    if (!tmsProfile || !formData.selectedVehicle) {
      console.error('Missing profile or vehicle selection');
      return null;
    }

    try {
      console.log('🔍 Checking receipt overlap:', { receiptDate, receiptVolume });
      
      const response = await apiClient.post('api/v1/ocr/check-receipt-overlap', {
        profile_id: tmsProfile.id,
        vehicle_reg: formData.selectedVehicle,
        receipt_date: receiptDate, // Format: DD/MM/YYYY
      });

      console.log('✅ Overlap check response:', response.data);
      return response.data;
    } catch (err) {
      console.error('❌ Overlap check error:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to check receipt overlap';
      setError((prev) => ({ ...prev, after: errorMsg }));
      return null;
    }
  };

  // NEW: Execute trip split
  const executeSplit = async () => {
    if (!pendingReceiptData || !overlapData) {
      console.error('Missing pending receipt data or overlap data');
      return;
    }

    try {
      setIsSplitting(true);
      setSplitProgress(['🔍 Validating split request...']);

      console.log('🔄 Executing split:', {
        originalReportId: overlapData.original_trip.id,
        newReceiptDate: pendingReceiptData.receiptDate,
        newReceiptVolume: pendingReceiptData.receiptVolume,
      });

      setSplitProgress((prev) => [...prev, '🗑️ Deleting original trip...']);

      const response = await apiClient.post('api/v1/ocr/split-trip', {
        original_report_id: overlapData.original_trip.id,
        new_receipt_date: pendingReceiptData.receiptDate,
        new_receipt_volume: pendingReceiptData.receiptVolume,
        profile_id: tmsProfile.id,
      });

      setSplitProgress((prev) => [...prev, '✅ Split completed successfully!']);

      console.log('✅ Split successful:', response.data);

      // Show success message
      setTimeout(() => {
        alert(`✅ Split successful! Created trips #${response.data.trip_a_id} and #${response.data.trip_b_id}`);
        
        // Redirect to reports page
        window.location.href = '/reports';
      }, 1000);

    } catch (err) {
      console.error('❌ Split error:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to split trip';
      alert('Split failed: ' + errorMsg);
      setSplitProgress((prev) => [...prev, '❌ Split failed: ' + errorMsg]);
    } finally {
      setIsSplitting(false);
    }
  };

  // NEW: Handle split confirmation
  const handleConfirmSplit = () => {
    setSplitDialogOpen(false);
    executeSplit();
  };

  const handleImageUpload = async (file, type) => {
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPreviews((prev) => ({ ...prev, [type]: previewUrl }));
    updateFormData(type === "before" ? "dieselBefore" : "dieselAfter", file);
    setIsLoading((prev) => ({ ...prev, [type]: true }));
    setError((prev) => ({ ...prev, [type]: null }));
    setExtractedData((prev) => ({ ...prev, [type]: null }));

    const uploadFormData = new FormData();
    uploadFormData.append("receipt", file);

    try {
      // Use apiClient to call your unified backend
      const response = await apiClient.post(
        "api/v1/ocr/process-receipt",
        uploadFormData,
      );
      const extractedReceiptData = response.data.data;
      
      // NEW: Check for overlap in custom_trip mode
      if (reportType === "custom_trip" && type === "after") {
        const overlapResult = await checkReceiptOverlap(
          extractedReceiptData.date,
          extractedReceiptData.volume
        );

        if (overlapResult && overlapResult.overlap_detected) {
          console.log('⚠️ Overlap detected!', overlapResult);
          
          // Store the pending receipt data
          setPendingReceiptData({
            receiptFile: file,
            receiptDate: extractedReceiptData.date,
            receiptVolume: extractedReceiptData.volume,
            extractedData: extractedReceiptData,
          });
          
          // Store overlap data
          setOverlapData(overlapResult);
          
          // Show split confirmation dialog
          setSplitDialogOpen(true);
          
          // Clear the loading state
          setIsLoading((prev) => ({ ...prev, [type]: false }));
          
          // Don't proceed with normal upload - wait for user confirmation
          return;
        }
      }
      
      // ⚠️ DATE VALIDATION: Prevent uploading receipts older than latest refuel
      // TODO: This validation logic will be enhanced later to handle edge cases
      // like missed receipts and backfilling. Current implementation strictly
      // prevents any receipt dated before the latest refuel.
      if (reportType === "since_last_refuel" && latestRefuel && type === "after") {
        try {
          // Parse latest refuel date (ISO format from backend: "2025-10-16T06:41:00")
          const latestDate = new Date(latestRefuel.transaction_date);
          
          // Parse extracted receipt date (Format: "DD/MM/YYYY" or "DD/MM/YY")
          const dateStr = extractedReceiptData.date;
          const [day, month, year] = dateStr.split('/');
          
          // Handle 2-digit or 4-digit year
          const fullYear = year.length === 2 ? `20${year}` : year;
          
          // Create date object at midnight for comparison (month is 0-indexed in JS)
          const extractedDate = new Date(parseInt(fullYear), parseInt(month) - 1, parseInt(day), 0, 0, 0);
          const latestDateOnly = new Date(latestDate.getFullYear(), latestDate.getMonth(), latestDate.getDate(), 0, 0, 0);
          
          console.log('🔍 Date validation check:', {
            latest: {
              raw: latestRefuel.transaction_date,
              parsed: latestDateOnly.toISOString(),
              display: latestRefuel.date
            },
            extracted: {
              raw: dateStr,
              parsed: extractedDate.toISOString(),
              display: extractedReceiptData.date
            },
            isValid: extractedDate > latestDateOnly
          });
          
          // Receipt must be AFTER the latest refuel (not equal)
          if (extractedDate <= latestDateOnly) {
            const errorMessage = `❌ This receipt is dated ${extractedReceiptData.date}, which is on or before your latest refuel (${latestRefuel.date}). Please upload a receipt dated AFTER ${latestRefuel.date}.`;
            console.error('❌ Date validation FAILED:', errorMessage);
            
            // Clear the upload and show error
            setError((prev) => ({ 
              ...prev, 
              [type]: errorMessage
            }));
            setPreviews((prev) => ({ ...prev, [type]: null }));
            updateFormData(type === "before" ? "dieselBefore" : "dieselAfter", null);
            setExtractedData((prev) => ({ ...prev, [type]: null }));
            setIsLoading((prev) => ({ ...prev, [type]: false }));
            return; // STOP processing here
          }
          
          console.log('✅ Date validation PASSED - receipt is newer than latest refuel');
        } catch (dateErr) {
          console.error('❌ Error during date validation:', dateErr);
          const errorMessage = `⚠️ Could not validate receipt date. Please ensure the receipt is dated after ${latestRefuel.date}.`;
          setError((prev) => ({ 
            ...prev, 
            [type]: errorMessage
          }));
          setPreviews((prev) => ({ ...prev, [type]: null }));
          updateFormData(type === "before" ? "dieselBefore" : "dieselAfter", null);
          setIsLoading((prev) => ({ ...prev, [type]: false }));
          return; // STOP on validation error
        }
      }
      
      setExtractedData((prev) => ({ ...prev, [type]: extractedReceiptData }));
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Failed to process image.";
      setError((prev) => ({ ...prev, [type]: errorMsg }));
      setPreviews((prev) => ({ ...prev, [type]: null }));
    } finally {
      setIsLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const removeImage = (type) => {
    setPreviews((prev) => ({ ...prev, [type]: null }));
    setExtractedData((prev) => ({ ...prev, [type]: null }));
    updateFormData(type === "before" ? "dieselBefore" : "dieselAfter", null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading((prev) => ({ ...prev, submit: true }));
    setError((prev) => ({ ...prev, submit: null }));

    if (!tmsProfile) {
      setError((prev) => ({
        ...prev,
        submit: "User profile not loaded. Cannot submit.",
      }));
      setIsLoading((prev) => ({ ...prev, submit: false }));
      return;
    }

    // Ensure WS is connected if using OTP method
    if (formData.loginMethod === "otp") {
      let waitMs = 0;
      if (!wsReady && !wsConnecting) {
        reconnectWithBackoff(6);
      }
      while (!wsReady && waitMs < 10000) {
        await new Promise((res) => setTimeout(res, 100));
        waitMs += 100;
      }
    }

    // ✅ Clean and properly typed payload
    const cleanPayload = {
      report_type: reportType || "custom_trip",
      extractedData:
        reportType === "since_last_refuel"
          ? {
              // Only send "after" image data for refuel flow
              after: extractedData.after
                ? {
                    date: extractedData.after.date,
                    time: extractedData.after.time,
                    vehicle_no: extractedData.after.vehicle_no,
                    volume: Number(extractedData.after.volume),
                  }
                : null,
            }
          : {
              // Send both for custom trip
              before: extractedData.before
                ? {
                    date: extractedData.before.date,
                    time: extractedData.before.time,
                    vehicle_no: extractedData.before.vehicle_no,
                    volume: Number(extractedData.before.volume),
                  }
                : null,
              after: extractedData.after
                ? {
                    date: extractedData.after.date,
                    time: extractedData.after.time,
                    vehicle_no: extractedData.after.vehicle_no,
                    volume: Number(extractedData.after.volume),
                  }
                : null,
            },
      loginDetails:
        formData.loginMethod === "otp"
          ? { login_method: "otp", mobile_number: formData.mobileNumber }
          : {
              login_method: "password",
              email: formData.email,
              password: formData.password,
            },
      selected_vehicle_registration_no: formData.selectedVehicle,
      session_id: sessionStorage.getItem("wsSessionId") || null,
    };

    // Add refuel flow data if applicable
    if (reportType === "since_last_refuel" && latestRefuel) {
      cleanPayload.refuel_flow_data = {
        use_stored_refuel: true,
        stored_refuel_id: latestRefuel.id,
      };
    }

    // Send over WebSocket instead of HTTP
    if (!ws || !wsReady) {
      setError((prev) => ({
        ...prev,
        submit: "OTP channel is not connected. Please connect and try again.",
      }));
      setIsLoading((prev) => ({ ...prev, submit: false }));
      return;
    }
    try {
      if (formData.loginMethod === "otp" && formData.mobileNumber) {
        try {
          ws.send(
            JSON.stringify({
              type: "mobile_number",
              mobile: formData.mobileNumber,
            }),
          );
        } catch {}
        // small delay to ensure server stores context before start
        await new Promise((res) => setTimeout(res, 100));
      }
      ws.send(
        JSON.stringify({ type: "start_automation", payload: cleanPayload }),
      );
      // Result is delivered via WS 'automation_complete' or 'automation_error'
    } catch (err) {
      setError((prev) => ({
        ...prev,
        submit: "Failed to start automation over WebSocket.",
      }));
      setIsLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  // Handle Profile Loading State
  if (isProfileLoading) {
    return <div className="form-container">Loading user profile...</div>;
  }

  if (error.profile) {
    return <div className="form-container error-message">{error.profile}</div>;
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1ReportDetails
            formData={formData}
            updateFormData={updateFormData}
            handleImageUpload={handleImageUpload}
            removeImage={removeImage}
            extractedData={extractedData}
            previews={previews}
            isLoading={isLoading}
            error={error}
            vehicles={vehicles}
            isLoadingVehicles={isLoadingVehicles}
            vehicleError={vehicleError}
            onNext={() => goToStep(2)}
            reportType={reportType}
            latestRefuel={latestRefuel}
            refuelError={refuelError}
            isLoadingRefuel={isLoadingRefuel}
          />
        );
      case 2:
        return (
          <Step2Login
            formData={formData}
            updateFormData={updateFormData}
            onBack={() => goToStep(1)}
            onSubmit={handleSubmit}
            isLoading={isLoading.submit}
            error={error.submit}
            wsReady={wsReady}
            backendWaitingOtp={backendWaitingOtp}
            wsConnecting={wsConnecting}
            wsRetryCount={wsRetryCount}
            wsError={wsError}
            onConnectClick={() => reconnectWithBackoff(6)}
          />
        );
      case 3:
        return <Step3FinalReport reportData={finalReportData} />;
      default:
        return <div>An unexpected error occurred.</div>;
    }
  };

  return (
    <div className="form-container">
      <FormSidebar currentStep={currentStep} />
      <div className="form-content">{renderStep()}</div>

      {/* OTP Modal */}
      {showOtp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              width: "320px",
            }}
          >
            <h4>Enter OTP</h4>
            <p style={{ fontSize: "12px", color: "#666" }}>
              An OTP is required to continue the login.
            </p>
            <div
              onPaste={handleOtpPaste}
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "space-between",
                marginTop: 10,
              }}
            >
              {otpDigits.map((d, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpRefs.current[idx] = el)}
                  value={d}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  style={{
                    width: 40,
                    height: 44,
                    textAlign: "center",
                    fontSize: 18,
                    border: "1px solid #ddd",
                    borderRadius: 6,
                  }}
                />
              ))}
            </div>
            {otpStatus === "error" && (
              <div
                style={{ color: "#EF4444", fontSize: "12px", marginTop: "8px" }}
              >
                Invalid OTP. Try again.
              </div>
            )}
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button
                onClick={submitOtpWs}
                disabled={otpDigits.join("").length !== 6}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "var(--primary-color, #3B82F6)",
                  color: "#fff",
                  border: 0,
                  borderRadius: "6px",
                  opacity: otpDigits.join("").length === 6 ? 1 : 0.7,
                }}
              >
                Submit
              </button>
              <button
                onClick={() => setShowOtp(false)}
                style={{
                  padding: "10px",
                  background: "#e5e7eb",
                  color: "#111827",
                  border: 0,
                  borderRadius: "6px",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Split Trip Confirmation Dialog */}
      <SplitTripConfirmationDialog
        open={splitDialogOpen}
        onClose={() => {
          setSplitDialogOpen(false);
          setPendingReceiptData(null);
          setOverlapData(null);
          setSplitProgress([]);
        }}
        onConfirm={handleConfirmSplit}
        overlapData={overlapData}
        newReceiptDate={pendingReceiptData?.receiptDate}
        newReceiptVolume={pendingReceiptData?.receiptVolume}
        isProcessing={isSplitting}
        progress={splitProgress}
      />

      {/* NEW: Processing Overlay */}
      {isSplitting && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "32px",
              borderRadius: "12px",
              textAlign: "center",
              maxWidth: "400px",
            }}
          >
            <div className="loading-spinner" style={{ marginBottom: "16px" }}>
              Processing...
            </div>
            <h3 style={{ margin: "0 0 16px 0" }}>Splitting Trip</h3>
            <div style={{ textAlign: "left", maxHeight: "200px", overflowY: "auto" }}>
              {splitProgress.map((msg, idx) => (
                <div key={idx} style={{ padding: "4px 0", fontSize: "14px" }}>
                  {msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FormSidebar = ({ currentStep }) => {
  const steps = [
    {
      number: 1,
      title: "Report Details",
      description: "Select vehicle & upload bills.",
      icon: ReportDetailsIcon,
    },
    {
      number: 2,
      title: "Login & Submit",
      description: "Finalize your report.",
      icon: LoginSubmitIcon,
    },
    {
      number: 3,
      title: "Report Generated",
      description: "View your results.",
      icon: SuccessIcon,
    },
  ];

  return (
    <aside className="form-sidebar">
      <div className="sidebar-header">
        <img src={UkoLogo} alt="Uko Logo" />
        <h3>New Report Request</h3>
      </div>
      <nav className="step-nav">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`step-item ${currentStep === step.number ? "active" : ""} ${currentStep > step.number ? "completed" : ""}`}
          >
            <div className="step-icon">
              <img src={step.icon} alt={step.title} />
            </div>
            <div className="step-details">
              <h4>{step.title}</h4>
              <p>{step.description}</p>
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};

const Step1ReportDetails = ({
  formData,
  updateFormData,
  handleImageUpload,
  removeImage,
  extractedData,
  previews,
  isLoading,
  error,
  vehicles,
  isLoadingVehicles,
  vehicleError,
  onNext,
  reportType,
  latestRefuel,
  refuelError,
  isLoadingRefuel,
}) => {
  // Validation based on report type
  const isNextDisabled =
    !formData.selectedVehicle || // Must have vehicle selected
    isLoadingRefuel || // Wait for refuel check to complete
    !reportType || // Wait for scenario detection
    (reportType === "since_last_refuel"
      ? !extractedData.after || !latestRefuel // Scenario B: need after image + latest refuel
      : !extractedData.before || !extractedData.after); // Scenario A: need both images

  // Find the selected vehicle to get its chassis number
  const selectedVehicle = vehicles.find(
    (vehicle) => vehicle.registration_no === formData.selectedVehicle,
  );

  return (
    <div className="form-step">
      <h3>Report Details</h3>
      <p>
        {!formData.selectedVehicle 
          ? "Select your vehicle to get started." 
          : reportType === "since_last_refuel"
          ? "✅ Found previous refuel data. Upload only the current fuel receipt."
          : reportType === "custom_trip"
          ? "📋 No previous refuel found. Upload both before and after fuel receipts."
          : "Loading vehicle data..."}
      </p>
      
      {/* Report Type Badge - Only show when vehicle is selected */}
      {reportType && (
        <div style={{ marginBottom: "16px" }}>
          <span
            style={{
              display: "inline-block",
              padding: "6px 12px",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "600",
              background:
                reportType === "since_last_refuel" ? "#10B98115" : "#3B82F615",
              color: reportType === "since_last_refuel" ? "#10B981" : "#3B82F6",
            }}
          >
            {reportType === "since_last_refuel"
              ? "Scenario B: Since Last Refuel"
              : "Scenario A: Custom Trip"}
          </span>
        </div>
      )}
      <div className="form-group">
        <label>Select Vehicle</label>
        <select
          value={formData.selectedVehicle}
          onChange={(e) => updateFormData("selectedVehicle", e.target.value)}
          disabled={isLoadingVehicles}
        >
          <option value="" disabled>
            {isLoadingVehicles
              ? "Loading vehicles..."
              : "Choose a vehicle from your profile"}
          </option>
          {/* Use the real 'vehicles' prop */}
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.registration_no}>
              {vehicle.registration_no} -{" "}
              {vehicle.vehicle_type || "Unknown Type"}
            </option>
          ))}
        </select>
        {vehicleError && <div className="error-message">{vehicleError}</div>}

        {/* Chassis Number Placeholder */}
        {formData.selectedVehicle && selectedVehicle && (
          <div className="chassis-placeholder">
            <span className="chassis-label">Chassis Number:</span>
            <span className="chassis-value">
              {selectedVehicle.chassis_number || "Not available"}
            </span>
          </div>
        )}
      </div>

      <div className="upload-section">
        {reportType === "since_last_refuel" ? (
          <>
            {/* Show Latest Refuel Data (Read-Only) */}
            {isLoadingRefuel && (
              <div className="refuel-display-card loading">
                <p>Loading last refuel data...</p>
              </div>
            )}

            {refuelError && (
              <div className="refuel-display-card error">
                <p>{refuelError}</p>
              </div>
            )}

            {latestRefuel && !isLoadingRefuel && (
              <div className="refuel-display-card">
                <h4>Last Refuel Details (Starting Point)</h4>
                <div className="refuel-data-grid">
                  <div className="refuel-data-item">
                    <span className="label">Date:</span>
                    <span className="value">{latestRefuel.date}</span>
                  </div>
                  <div className="refuel-data-item">
                    <span className="label">Time:</span>
                    <span className="value">{latestRefuel.time}</span>
                  </div>
                  <div className="refuel-data-item">
                    <span className="label">Vehicle:</span>
                    <span className="value">{latestRefuel.vehicle_no}</span>
                  </div>
                  <div className="refuel-data-item">
                    <span className="label">Volume:</span>
                    <span className="value">{latestRefuel.volume} L</span>
                  </div>
                </div>
                <div className="refuel-chip">
                  ✓ Using stored data - no upload needed
                </div>
              </div>
            )}

            {/* Upload After Image Only */}
            <ImageUploader
              type="after"
              title="Current Fuel Receipt"
              onUpload={handleImageUpload}
              onRemove={removeImage}
              extractedData={extractedData.after}
              preview={previews.after}
              isLoading={isLoading.after}
              error={error.after}
            />
          </>
        ) : (
          <>
            {/* Custom Trip: Show Both Uploads */}
            <ImageUploader
              type="before"
              title="Before Journey Diesel Bill"
              onUpload={handleImageUpload}
              onRemove={removeImage}
              extractedData={extractedData.before}
              preview={previews.before}
              isLoading={isLoading.before}
              error={error.before}
            />
            <ImageUploader
              type="after"
              title="After Journey Diesel Bill"
              onUpload={handleImageUpload}
              onRemove={removeImage}
              extractedData={extractedData.after}
              preview={previews.after}
              isLoading={isLoading.after}
              error={error.after}
            />
          </>
        )}
      </div>

      <div className="form-navigation">
        <button
          className="btn-continue"
          onClick={onNext}
          disabled={isNextDisabled}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

const ImageUploader = ({
  type,
  title,
  onUpload,
  onRemove,
  extractedData,
  preview,
  isLoading,
  error,
}) => (
  <div className="image-uploader">
    <h5>{title}</h5>

    <div className="image-uploader-content">
      {/* Left: Upload/Preview */}
      <div className="upload-preview-section">
        {!preview ? (
          <label className="upload-box">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onUpload(e.target.files[0], type)}
            />
            <img src={UploadIcon} alt="Upload" />
            <span>Click to upload or drag & drop</span>
          </label>
        ) : (
          <div className="image-preview-container">
            <img src={preview} alt="Receipt preview" className="image-preview" />
            <button className="remove-image-btn" onClick={() => onRemove(type)}>
              ×
            </button>
          </div>
        )}

        {isLoading && <div className="loading-spinner">Processing image...</div>}
        {error && <div className="error-message">{error}</div>}
      </div>

      {/* Right: Details in same style as Last Refuel */}
      <div className="extracted-info-section">
        {extractedData ? (
          <>
            <div className="data-header">Receipt Details</div>
            <div className="refuel-data-grid">
              <div className="refuel-data-item">
                <span className="label">Date:</span>
                <span className="value">{extractedData.date}</span>
              </div>
              <div className="refuel-data-item">
                <span className="label">Time:</span>
                <span className="value">{extractedData.time}</span>
              </div>
              <div className="refuel-data-item">
                <span className="label">Vehicle:</span>
                <span className="value">{extractedData.vehicle_no}</span>
              </div>
              <div className="refuel-data-item">
                <span className="label">Volume:</span>
                <span className="value">{extractedData.volume.toFixed(2)} L</span>
              </div>
            </div>
          </>
        ) : (
          <div className="waiting-state">Upload a receipt to see details.</div>
        )}
      </div>
    </div>
  </div>
);

const Step2Login = ({
  formData,
  updateFormData,
  onBack,
  onSubmit,
  isLoading,
  error,
  wsReady,
  backendWaitingOtp,
  wsConnecting,
  wsRetryCount,
  wsError,
  onConnectClick,
}) => (
  <div className="form-step">
    <h3>Login & Submit</h3>
    <p>Authenticate to FleetEdge using either Email/Password or Mobile OTP.</p>

    {/* Connection indicator for OTP channel */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "8px 0 16px",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 9999,
          background: wsReady ? "#10B981" : "#EF4444",
          display: "inline-block",
        }}
      />
      <span
        style={{
          fontSize: 12,
          color: wsReady ? "#065f46" : wsError ? "#7f1d1d" : "#7f1d1d",
        }}
      >
        {wsReady
          ? "OTP channel connected"
          : wsError || "OTP channel not connected yet"}
      </span>
      {!wsReady && (
        <button
          type="button"
          onClick={onConnectClick}
          disabled={wsConnecting}
          style={{
            marginLeft: 12,
            padding: "6px 10px",
            fontSize: 12,
            borderRadius: 6,
            border: 0,
            background: wsConnecting
              ? "#e5e7eb"
              : "var(--primary-color, #3B82F6)",
            color: wsConnecting ? "#6b7280" : "#fff",
          }}
        >
          {wsConnecting ? `Connecting... (${wsRetryCount})` : "Connect"}
        </button>
      )}
    </div>

    {backendWaitingOtp && (
      <div
        style={{
          background: "#FEF3C7",
          border: "1px solid #F59E0B",
          color: "#92400E",
          padding: "8px 12px",
          borderRadius: 6,
          marginBottom: 12,
          fontSize: 13,
        }}
      >
        Backend is waiting for your OTP. Please enter the OTP sent to your
        mobile.
      </div>
    )}

    {/* Login Method Tabs */}
    <div className="login-tabs">
      <button
        type="button"
        className={`tab-button ${formData.loginMethod === "password" ? "active" : ""}`}
        onClick={() => updateFormData("loginMethod", "password")}
      >
        Email & Password
      </button>
      <button
        type="button"
        className={`tab-button ${formData.loginMethod === "otp" ? "active" : ""}`}
        onClick={() => updateFormData("loginMethod", "otp")}
      >
        Mobile OTP
      </button>
    </div>

    {/* Login Form Container */}
    <div className="login-form-container">
      <form onSubmit={onSubmit}>
        {formData.loginMethod === "password" ? (
          <>
            <div className="form-group">
              <label>User ID / Email</label>
              <input
                type="text"
                placeholder="Enter your Fleet Edge User ID"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => updateFormData("password", e.target.value)}
                required
              />
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={formData.mobileNumber}
                onChange={(e) =>
                  updateFormData(
                    "mobileNumber",
                    e.target.value.replace(/[^0-9]/g, "").slice(0, 10),
                  )
                }
                required
              />
            </div>
            <div
              className="hint-text"
              style={{ fontSize: 12, color: "#6b7280", marginTop: -8 }}
            >
              We'll request OTP after sending your number to FleetEdge.
            </div>
          </>
        )}

        {error && <div className="error-message submit-error">{error}</div>}
        <div className="form-navigation">
          <button type="button" className="btn-back" onClick={onBack}>
            Back
          </button>
          <button type="submit" className="btn-continue" disabled={isLoading}>
            {isLoading ? "Generating Report..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const Step3FinalReport = ({ reportData }) => {
  if (!reportData) {
    return (
      <div className="success-step">
        <div className="loading-spinner">Loading final report...</div>
      </div>
    );
  }

  // Helper to safely parse and calculate
  const getBilledFuel = () => {
    try {
      const distance = parseFloat(reportData["Distance (Kms)"]);
      const actualMileage = parseFloat(
        reportData["Actual Mileage"].split(" ")[0],
      );
      if (actualMileage > 0) {
        return `${(distance / actualMileage).toFixed(2)} L`;
      }
    } catch (e) {
      return "N/A";
    }
    return "N/A";
  };

  return (
    <div className="final-report-container">
      {/* Success Header */}
      <div className="report-success-header">
        <div className="success-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <div className="success-content">
          <h2>Report Generated Successfully!</h2>
          <p>Here is a summary of the fuel consumption analysis.</p>
        </div>
      </div>

      {/* Vehicle Info Card */}
      <div className="modern-card vehicle-card">
        <div className="card-header">
          <h3>Vehicle Details</h3>
        </div>
        <div className="vehicle-info">
          {reportData["Vehicle Details"]}
        </div>
      </div>

      {/* Data Cards Grid */}
      <div className="report-cards-grid">
        {/* Odometer & Distance */}
        <div className="modern-card">
          <div className="card-header">
            <h3>Odometer & Distance</h3>
          </div>
          <div className="data-rows">
            <div className="data-row">
              <span className="label">Start:</span>
              <span className="value">{reportData["Odometer Start"]} Km</span>
            </div>
            <div className="data-row">
              <span className="label">End:</span>
              <span className="value">{reportData["Odometer End"]} Km</span>
            </div>
            <div className="data-row highlight">
              <span className="label">Distance:</span>
              <span className="value">{reportData["Distance (Kms)"]} Km</span>
            </div>
          </div>
        </div>

        {/* Fuel Consumption */}
        <div className="modern-card">
          <div className="card-header">
            <h3>Fuel Consumption</h3>
          </div>
          <div className="data-rows">
            <div className="data-row">
              <span className="label">FleetEdge System:</span>
              <span className="value">{reportData["Fuel Consumed"]}</span>
            </div>
            <div className="data-row highlight">
              <span className="label">From Bills:</span>
              <span className="value">{getBilledFuel()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mileage Analysis */}
      <div className="modern-card mileage-analysis">
        <div className="card-header">
          <h3>Mileage Analysis</h3>
        </div>
        <div className="mileage-metrics">
          <div className="metric">
            <div className="metric-label">FleetEdge System</div>
            <div className="metric-value primary">{reportData["Fuel Efficiency (FleetEdge)"]}</div>
          </div>
          <div className="metric">
            <div className="metric-label">Calculated (System Fuel)</div>
            <div className="metric-value secondary">{reportData["Calculated Mileage"]}</div>
          </div>
          <div className="metric">
            <div className="metric-label">Actual (Bill Fuel)</div>
            <div className="metric-value accent">{reportData["Actual Mileage"]}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestFormPage;
