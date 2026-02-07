import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEye, faPen, faEllipsis, faX, faArrowRightFromBracket} from "@fortawesome/free-solid-svg-icons";
import {Dispatch, SetStateAction, useCallback, useContext, useEffect, useRef, useState} from "react";
import {AuthUser} from "../../../../../Types/CalenoteTypes";
import {EventsData, ParticipantsData} from "../../CalenoteSectionsData";
import axios from "axios";
import {GlobalUIContext} from "../../../../../Providers/GlobalUIContext";
import {AlertsData} from "../../../../../Components/Elements/ElementsData";

interface ParticipantControlProps {
    setEvents: Dispatch<SetStateAction<EventsData[]>>;
    resetEvent: () => void;
    IsEditAuthority: "owner" | "editor" | "viewer" | null | undefined;
    disabled: boolean;
    saveEvent: ()=> Promise<string | undefined>;
    eventId: string | null;
    eventParticipants: ParticipantsData[];
    setEventParticipants: Dispatch<SetStateAction<ParticipantsData[]>>;
    auth: {
        user: AuthUser | null;
    };
}

export default function ParticipantControl({ setEvents, resetEvent, IsEditAuthority, disabled, saveEvent, eventId, eventParticipants, setEventParticipants, auth }:ParticipantControlProps) {
    const ui = useContext(GlobalUIContext);

    if (!ui) {
        throw new Error("Calendar must be used within GlobalProvider");
    }

    const {
        setAlerts,
        setLoading,
        loading
    } = ui;

    const [IsParticipantFocus, setIsParticipantFocus] = useState<boolean>(false);
    const [IsParticipantEmail, setIsParticipantEmail] = useState<boolean>(false);

    const [participantControl, setParticipantControl] = useState<string>("");

    const activeEventParticipantAreaRef = useRef<HTMLDivElement>(null);

    type activeEventParticipantData = {
        "id": number,
        "status": "EventUser" | "EventInvitation";
    }

    const [activeEventParticipant, setActiveEventParticipant] = useState<activeEventParticipantData[]>([]);


    useEffect(() => {
        function matchesPattern(text:string) {
            return /^\S+@\S+\.\S+$/.test(text);
        }

        setIsParticipantEmail(matchesPattern(participantControl));
    }, [participantControl]);

    const eventInvite = useCallback(async (email: string, role: "editor" | "viewer", localEventId?: string) => {
            const currentEventId:string | null = localEventId ?? eventId;

        if(!currentEventId || !email.trim() || (!role.includes('editor') && !role.includes('viewer'))) return;

        const removeSpaceEmail:string = email.trim();

        setLoading(true);

        try {
            const res = await axios.post(`/api/event/${currentEventId}/invitations`, {
                email: removeSpaceEmail,
                role: role
            });

            if(res.data.success) {
                const newParticipantsData:ParticipantsData = {
                    user_name: null,
                    user_id: null,
                    event_id: currentEventId,
                    email: removeSpaceEmail,
                    role: null,
                    status: "pending",
                    invitation_id: res.data.invitationId
                }

                setEventParticipants(pre => [...pre, newParticipantsData]);
            } else {
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    type Role = "owner" | "editor" | "viewer" | null;
    type Status = "pending" | "declined" | "expired" | null;

    const eventParticipantRoleChangeKorean = (
        value: Role | Status
    ): string => {
        if (!value) return "";

        const map: Record<string, string> = {
            owner: "소유자",
            editor: "편집 권한",
            viewer: "열람 권한",
            pending: "대기",
            declined: "거절",
            expired: "만료",
        };

        return map[value] ?? "";
    };

    useEffect(() => {
        const handleClickOutside = (e : any) => {
            if (activeEventParticipantAreaRef.current && activeEventParticipantAreaRef.current && !activeEventParticipantAreaRef.current.contains(e.target)) {
                setActiveEventParticipant([]);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const removeParticipant = useCallback(async (self: boolean = false) => {
        if(activeEventParticipant.length <= 0 || !eventId) return;

        try {
            const res = await axios.delete('/api/event/participants', {
                data : {
                    id: activeEventParticipant[0]!.id,
                    status: activeEventParticipant[0]!.status,
                    event_id: eventId,
                    self: self
                }
            });

            if(res.data.success) {
                if(self) {
                    resetEvent();
                    setEvents(prev =>
                        prev.filter(e => e.uuid !== eventId)
                    );
                }
                setEventParticipants(pre =>
                    pre.filter(eventParticipant =>
                        eventParticipant.user_id ? (
                            !(eventParticipant.user_id === activeEventParticipant[0]!.id &&
                                activeEventParticipant[0]!.status === "EventUser")
                        ) : !(eventParticipant.invitation_id === activeEventParticipant[0]!.id &&
                            activeEventParticipant[0]!.status === "EventInvitation")
                    )
                );
            } else {
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
            }
        } catch (err) {
            console.error(err);
        }
    }, [activeEventParticipant, eventId]);

    const changeEventUserRole = useCallback(async (role: "editor" | "viewer") => {
        if(activeEventParticipant.length <= 0 || !eventId || !role || activeEventParticipant[0]?.status !== "EventUser") return;

        try {
            const res = await axios.put(`/api/event/event-user/role`, {
                event_id: eventId,
                role: role,
                id: activeEventParticipant[0]?.id
            });

            if(res.data.success) {
                setEventParticipants(pre =>
                    pre.map(eventParticipant => {
                        if (
                            eventParticipant.user_id &&
                            eventParticipant.user_id === activeEventParticipant[0]!.id
                        ) {
                            return {
                                ...eventParticipant,
                                role: role,
                            };
                        }

                        return eventParticipant;
                    })
                );
            } else {
                const alertData:AlertsData = {
                    id: new Date(),
                    message: res.data.message,
                    type: res.data.type
                }
                setAlerts(pre => [...pre, alertData]);
            }
        } catch (err) {
            console.error(err);
        }

    }, [activeEventParticipant, eventId]);

    return (
        <div className="px-5 flex flex-wrap">
            <label
                htmlFor="participant"
                className="text-xs font-semibold mb-2"
            >
                참가자
            </label>

            {(eventParticipants.length > 0 && auth) ? (
                <div className="mb-2 space-y-2 bg-transparent rounded outline-none border-gray-300 w-full dark:border-gray-800 font-semibold text-xs">
                    {eventParticipants.map((eventParticipant, index) =>
                    {
                        const active = activeEventParticipant[0];

                        const isActive =
                            active &&
                            (
                                active.status === "EventUser"
                                    ? active.id === eventParticipant.user_id
                                    : active.id === eventParticipant.invitation_id
                            );

                        return(
                            <div className={`border border-gray-200 dark:border-gray-800 group p-2 w-full rounded ${isActive ? "bg-gray-950/10 dark:bg-gray-600" : `${auth.user?.id === eventParticipant.user_id ? "bg-blue-500/10" : ""} hover:bg-gray-950/10 dark:hover:bg-gray-600`} flex flex-row relative`} key={index}>
                                <div className="w-[70%] max-w-[70%] flex items-center space-x-1">
                                    <div className="size-4 bg-gray-500 rounded-full flex justify-center items-center">
                                        <span className="text-[0.5rem] leading-[0.5] text-center text-white">{eventParticipant.user_name ? eventParticipant.user_name[0] : eventParticipant.email[0]}</span>
                                    </div>
                                    <div className="max-w-[80%]">
                                        <p className="w-full truncate">{eventParticipant.user_name ? eventParticipant.user_name : eventParticipant.email}</p>
                                        <p className="text-[0.65rem]">{eventParticipantRoleChangeKorean(eventParticipant.role ?? eventParticipant.status)}</p>
                                    </div>
                                </div>
                                <div className="flex-1 flex justify-end items-center">
                                    {((IsEditAuthority === "owner" && eventParticipant.role !== "owner") ||
                                        (eventParticipant.user_id === auth.user?.id && eventParticipant.role !== "owner")) ? (
                                        <button onClick={() => {
                                            setActiveEventParticipant([
                                                {
                                                    id: eventParticipant.user_id
                                                        ? Number(eventParticipant.user_id)
                                                        : Number(eventParticipant.invitation_id),
                                                    status: eventParticipant.user_id ? "EventUser" : "EventInvitation"
                                                }
                                            ]);
                                        }} className={`${isActive ? "" : "text-[10px] block sm:hidden group-hover:block cursor-pointer"}`}>
                                            <FontAwesomeIcon icon={faEllipsis} />
                                        </button>
                                    ) : ""}
                                </div>
                                {isActive ? (
                                    <div ref={activeEventParticipantAreaRef} className="w-[calc(100%-0.5rem)] absolute z-[1] -left-5 top-5 rounded bg-white dark:bg-gray-950 border-[0.5px] border-gray-200 dark:border-gray-800 p-2 space-x-2">
                                        {
                                            IsEditAuthority === "owner" ? (
                                                <>
                                                    {
                                                        (eventParticipant.role !== "owner" && eventParticipant.role === "editor") ? (
                                                            <button onClick={async () => {
                                                                await changeEventUserRole("viewer");
                                                            }} className="btn transition-colors duration-300 w-full flex justify-start items-center px-0 py-2 text-gray-950 dark:text-white hover:bg-gray-950/10 dark:hover:bg-gray-600 space-x-1">
                                                                <FontAwesomeIcon icon={faEye}/>
                                                                <span>열람 권한으로 변경</span>
                                                            </button>
                                                        ) : ""
                                                    }
                                                    {
                                                        (eventParticipant.role !== "owner" && eventParticipant.role === "viewer") ? (
                                                            <button onClick={async () => {
                                                                await changeEventUserRole("editor");
                                                            }} className="btn transition-colors duration-300 w-full flex justify-start items-center px-0 py-2 text-gray-950 dark:text-white hover:bg-gray-950/10 dark:hover:bg-gray-600 space-x-1">
                                                                <FontAwesomeIcon icon={faPen}/>
                                                                <span>편집 권한으로 변경</span>
                                                            </button>
                                                        ) : ""
                                                    }
                                                    {
                                                        (eventParticipant.role !== "owner") ? (
                                                            <button onClick={async () => {
                                                                await removeParticipant(false);
                                                            }} className="btn transition-colors duration-300 w-full flex justify-start items-center py-2 text-red-500 hover:text-red-50 hover:bg-red-500/80 space-x-1">
                                                                <FontAwesomeIcon icon={faX}/>
                                                                <span>제거</span>
                                                            </button>
                                                        ) : ""
                                                    }
                                                </>
                                            ) : ((eventParticipant.user_id === auth.user?.id && eventParticipant.role !== "owner") ? (
                                                <button onClick={async () => {
                                                    await removeParticipant(true);
                                                }} className="btn transition-colors duration-300 w-full flex justify-start items-center py-2 text-red-500 hover:text-red-50 hover:bg-red-500/80 space-x-1">
                                                    <FontAwesomeIcon icon={faArrowRightFromBracket}/>
                                                    <span>나가기</span>
                                                </button>
                                            ) : "")
                                        }
                                    </div>
                                ) : ""}
                            </div>
                        );
                    })}
                </div>
            ) : ""}

            <div className="w-full relative">
                <input
                    disabled={disabled}
                    onFocus={() => { setIsParticipantFocus(true); }}
                    onBlur={() => { setIsParticipantFocus(false); }}
                    type="text"
                    id="participant"
                    value={participantControl}
                    onChange={(e) => { setParticipantControl(e.target.value); }}
                    className="border w-full border-gray-300 dark:border-gray-800 px-1 py-2 rounded bg-transparent text-xs font-semibold outline-none"
                    placeholder="참가자 추가"
                />

                {(IsParticipantFocus && IsParticipantEmail) ?
                    <div className="absolute w-full top-[34px] rounded bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800">


                        {(() => {

                            return(
                                <div className="p-2 w-full text-xs hover:bg-gray-950/10 dark:hover:bg-gray-600 rounded flex items-center justify-between group">
                                    <p className="truncate max-w-[70%]">{participantControl}</p>

                                    <div className="space-x-2">
                                        <button disabled={loading} onMouseDown={async () => {
                                    if(!eventParticipants.some(participant => participant.email === participantControl)) {
                                        let localEventId:string | undefined;
                                        if(!eventId) {
                                            localEventId = await saveEvent();
                                        }
                                        await eventInvite(participantControl, "viewer", localEventId);
                                        setParticipantControl("");
                                    }
                                    }} className="cursor-pointer opacity-0 group-hover:opacity-100 hover:text-gray-300">
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button disabled={loading} onMouseDown={async () => {
                                    if(!eventParticipants.some(participant => participant.email === participantControl)) {
                                        let localEventId:string | undefined;
                                        if(!eventId) {
                                            localEventId = await saveEvent();
                                        }
                                        await eventInvite(participantControl, "editor", localEventId);
                                        setParticipantControl("");
                                    }
                                    }} className="cursor-pointer opacity-0 group-hover:opacity-100 hover:text-gray-300">
                                            <FontAwesomeIcon icon={faPen} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div> : ""}
            </div>
        </div>
    );
}
