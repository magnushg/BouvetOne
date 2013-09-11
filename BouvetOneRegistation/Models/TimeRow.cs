using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BouvetOneRegistation.Models
{
    public class TimeRow
    {
        public int Id { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public ICollection<TimeSlot> Slots { get; set; }
    }
}