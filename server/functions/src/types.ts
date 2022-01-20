export interface RequestValidation {
    view_state: string;
    event_validation: string;
}

export namespace Parsed {
    export interface Schedule {
        [group: string]: Array<Sessions>;
    }

    export interface Sessions {
        x: number;
        y: number;
        location?: string;
        staff?: Staff;
    }

    export interface Staff {
        id?: string;
        name?: string;
        email?: string;
    }
}

export namespace Stored {
    export interface Course {
        loaded: boolean;
        sched?: Parsed.Schedule;
        lastUpdateTime: number; // unix millis
        code: string;
        id: string;
        course_name: string;
    }

    export interface Group {
        loaded: boolean;
        sched?: Parsed.Schedule;
        lastUpdateTime: number; // unix millis
        group_name: string;
        id: string[];
    }
}
